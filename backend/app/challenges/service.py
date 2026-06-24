"""Challenge service — business logic for provisioning and lifecycle management."""
import os
import time
import threading
from datetime import datetime, timedelta, timezone
from uuid import uuid4

try:
    from google.cloud import compute_v1, resourcemanager_v3
    from google.oauth2 import service_account
except ImportError:
    # Google Cloud SDK packages not installed
    compute_v1 = None
    resourcemanager_v3 = None
    service_account = None

from sqlalchemy.orm import Session

from app.config import GCP_PROJECT_ID, GCP_KEY_PATH
from app.models.challenge_sessions import ChallengeSession
from app.models.environments import Environment
from app.scenarios.models import Mission


class ChallengeService:
    """Service for challenge provisioning and lifecycle management."""

    def __init__(self):
        """Initialize service."""
        pass

    @staticmethod
    def get_mission(db: Session, mission_id: str):
        """Load mission from database."""
        return db.query(Mission).filter(Mission.mission_id == mission_id).first()

    @staticmethod
    def extract_provisioning_params(mission: Mission):
        """Extract GCP provisioning parameters from mission success_criteria."""
        # Find compute_instance criterion
        compute_criteria = next(
            (c for c in mission.success_criteria
             if isinstance(c, dict) and c.get("resource_type") == "compute_instance"),
            None
        )

        if not compute_criteria:
            return None

        expected_state = compute_criteria.get("expected_state", {})

        return {
            "name_suffix": expected_state.get("name_suffix", "sandbox-vm"),
            "machine_type": expected_state.get("machine_type", "e2-micro"),
            "zone": expected_state.get("zone", "us-central1-a"),
            "network": expected_state.get("network", "default"),
            "startup_script": expected_state.get("startup_script", "#!/bin/bash\necho 'Server online.'"),
        }

    @staticmethod
    def provision_gcp_environment(user_email: str, provisioning_params: dict):
        """Provision GCP Compute Instance and return VM name and console URL."""
        if not GCP_KEY_PATH or not os.path.exists(GCP_KEY_PATH):
            raise FileNotFoundError(
                f"GCP_KEY_PATH environment variable must be set to a valid service account key file. "
                f"Current value: {GCP_KEY_PATH}"
            )

        credentials = service_account.Credentials.from_service_account_file(GCP_KEY_PATH)
        project_name = f"projects/{GCP_PROJECT_ID}"

        # Step 1: Grant IAM roles at project level
        print(f"[IAM-PHASE] Granting roles to: {user_email}")
        try:
            projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
            policy = projects_client.get_iam_policy(request={"resource": project_name})

            policy.bindings.add(
                role="roles/browser",
                members=[f"user:{user_email}"]
            )
            policy.bindings.add(
                role="roles/compute.viewer",
                members=[f"user:{user_email}"]
            )

            projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
            print("[IAM-PHASE] Roles granted. Waiting for propagation...")
            time.sleep(5)
        except Exception as e:
            raise Exception(f"IAM Control Error: {str(e)}")

        # Step 2: Extract provisioning parameters
        name_suffix = provisioning_params["name_suffix"]
        machine_type = provisioning_params["machine_type"]
        zone = provisioning_params["zone"]
        network_name = provisioning_params["network"]
        script_value = provisioning_params["startup_script"]

        unique_id = str(uuid4())[:8]
        vm_name = f"{name_suffix}-{unique_id}"

        # Step 3: Provision VM
        instance_client = compute_v1.InstancesClient(credentials=credentials)
        operation_client = compute_v1.ZoneOperationsClient(credentials=credentials)

        instance = compute_v1.Instance()
        instance.name = vm_name
        instance.machine_type = f"zones/{zone}/machineTypes/{machine_type}"

        boot_disk = compute_v1.AttachedDisk(
            boot=True,
            auto_delete=True,
            type_=compute_v1.AttachedDisk.Type.PERSISTENT.name,
            initialize_params=compute_v1.AttachedDiskInitializeParams(
                source_image="projects/debian-cloud/global/images/family/debian-11",
                disk_size_gb=10
            )
        )
        instance.disks = [boot_disk]

        network_interface = compute_v1.NetworkInterface(
            name=network_name,
            access_configs=[compute_v1.AccessConfig(
                name="External NAT",
                type_=compute_v1.AccessConfig.Type.ONE_TO_ONE_NAT.name
            )]
        )
        instance.network_interfaces = [network_interface]

        tags = compute_v1.Tags(items=["http-server", "https-server", "lb-server"])
        instance.tags = tags

        instance.metadata = compute_v1.Metadata(
            items=[compute_v1.Items(key="startup-script", value=script_value)]
        )

        print(f"[PROVISION-PHASE] Deploying VM: {vm_name}")
        operation = instance_client.insert(project=GCP_PROJECT_ID, zone=zone, instance_resource=instance)

        # Wait for provisioning to complete
        print("[POLLING-PHASE] Waiting for VM provisioning...")
        start_time = time.time()
        while operation.status != compute_v1.Operation.Status.DONE:
            if time.time() - start_time > 90:
                raise TimeoutError("VM provisioning timed out")
            time.sleep(3)
            operation = operation_client.get(project=GCP_PROJECT_ID, zone=zone, operation=operation.name)

        if operation.error:
            raise Exception(f"GCP Operation Error: {operation.error}")

        print(f"[SUCCESS] VM provisioned: {vm_name}")

        # Grant instance-level access
        print(f"[INSTANCE-IAM] Granting admin access to: {user_email}")
        try:
            iam_policy = instance_client.get_iam_policy(
                project=GCP_PROJECT_ID,
                zone=zone,
                resource=vm_name
            )

            binding = compute_v1.Binding()
            binding.role = "roles/compute.instanceAdmin.v1"
            binding.members = [f"user:{user_email}"]

            iam_policy.bindings.append(binding)

            instance_client.set_iam_policy(
                project=GCP_PROJECT_ID,
                zone=zone,
                resource=vm_name,
                zone_set_policy_request_resource=compute_v1.ZoneSetPolicyRequest(policy=iam_policy)
            )
            print(f"[INSTANCE-IAM] Instance admin role granted to {user_email}")
        except Exception as e:
            print(f"[INSTANCE-IAM-ERROR] Could not set instance access: {str(e)}")
            raise

        gcp_console_url = f"https://console.cloud.google.com/compute/instancesDetail/zones/{zone}/instances/{vm_name}?project={GCP_PROJECT_ID}"

        return {
            "vm_name": vm_name,
            "zone": zone,
            "gcp_console_url": gcp_console_url,
        }

    @staticmethod
    def cleanup_environment(user_email: str, vm_name: str, zone: str):
        """Delete VM and remove IAM permissions."""
        if not GCP_KEY_PATH or not os.path.exists(GCP_KEY_PATH):
            raise FileNotFoundError(
                f"GCP_KEY_PATH environment variable must be set to a valid service account key file. "
                f"Current value: {GCP_KEY_PATH}"
            )

        credentials = service_account.Credentials.from_service_account_file(GCP_KEY_PATH)
        project_name = f"projects/{GCP_PROJECT_ID}"

        print(f"[CLEANUP] Starting cleanup for {user_email} on {vm_name}")

        # Delete VM
        try:
            instance_client = compute_v1.InstancesClient(credentials=credentials)
            operation_client = compute_v1.ZoneOperationsClient(credentials=credentials)

            print(f"[CLEANUP-DELETE] Deleting VM: {vm_name}")
            delete_operation = instance_client.delete(
                project=GCP_PROJECT_ID,
                zone=zone,
                instance=vm_name
            )

            timeout = 60
            start_time = time.time()
            while delete_operation.status != compute_v1.Operation.Status.DONE:
                if time.time() - start_time > timeout:
                    print("[CLEANUP-DELETE-WARNING] VM deletion timed out")
                    break
                time.sleep(2)
                delete_operation = operation_client.get(
                    project=GCP_PROJECT_ID,
                    zone=zone,
                    operation=delete_operation.name
                )

            print(f"[CLEANUP-DELETE] VM deleted: {vm_name}")
        except Exception as e:
            print(f"[CLEANUP-DELETE-ERROR] Could not delete VM: {str(e)}")

        # Remove IAM permissions
        try:
            projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
            policy = projects_client.get_iam_policy(request={"resource": project_name})

            user_member = f"user:{user_email}"
            for binding in policy.bindings:
                if user_member in binding.members:
                    binding.members = [m for m in binding.members if m != user_member]

            policy.bindings = [b for b in policy.bindings if b.members]

            projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
            print(f"[CLEANUP-IAM] IAM permissions removed for {user_email}")
        except Exception as e:
            print(f"[CLEANUP-IAM-ERROR] Could not remove IAM permissions: {str(e)}")

        print(f"[CLEANUP] Cleanup completed for {user_email}")

    @staticmethod
    def schedule_cleanup(user_email: str, vm_name: str, zone: str, time_limit_minutes: int):
        """Schedule cleanup after time limit (threading-based, temporary)."""
        def auto_cleanup():
            time.sleep(time_limit_minutes * 60)
            print(f"[AUTO-CLEANUP] Time limit reached for {user_email}")
            try:
                ChallengeService.cleanup_environment(user_email, vm_name, zone)
            except Exception as e:
                print(f"[AUTO-CLEANUP-ERROR] Cleanup failed: {str(e)}")

        cleanup_thread = threading.Thread(target=auto_cleanup, daemon=True)
        cleanup_thread.start()
