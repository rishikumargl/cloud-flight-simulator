"""Challenge service — business logic for provisioning and lifecycle management."""
import os
import time
import threading
from datetime import datetime, timedelta, timezone
from uuid import uuid4

try:
    from google.cloud import compute_v1, resourcemanager_v3
    from google.iam.v1 import policy_pb2
    from google.type import expr_pb2
    from google.oauth2 import service_account
except ImportError:
    # Google Cloud SDK packages not installed
    compute_v1 = None
    resourcemanager_v3 = None
    policy_pb2 = None
    expr_pb2 = None
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
        """Extract GCP provisioning parameters from mission success_criteria.

        Includes both expected_state and fault_configuration if present.
        """
        # Find compute_instance criterion (use first one as baseline)
        compute_criteria = next(
            (c for c in mission.success_criteria
             if isinstance(c, dict) and c.get("resource_type") == "compute_instance"),
            None
        )

        if not compute_criteria:
            return None

        expected_state = compute_criteria.get("expected_state", {})
        fault_config = compute_criteria.get("fault_configuration")

        return {
            "name_suffix": expected_state.get("name_suffix", "sandbox-vm"),
            "machine_type": expected_state.get("machine_type", "e2-micro"),
            "zone": expected_state.get("zone", "us-central1-a"),
            "network": expected_state.get("network", "default"),
            "startup_script": expected_state.get("startup_script", "#!/bin/bash\necho 'Server online.'"),
            "metadata": expected_state.get("metadata", {}),
            "network_tags": expected_state.get("network_tags", ["http-server", "https-server", "lb-server"]),
            "fault_configuration": fault_config,
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

            # Create bindings (use google.iam.v1.policy_pb2.Binding)
            member = f"user:{user_email}"

            binding1 = policy_pb2.Binding()
            binding1.role = "roles/browser"
            binding1.members.append(member)
            policy.bindings.append(binding1)

            binding2 = policy_pb2.Binding()
            binding2.role = "roles/compute.viewer"
            binding2.members.append(member)
            policy.bindings.append(binding2)

            # SetIamPolicyRequest is auto-generated from the resourcemanager API
            # Call set_iam_policy with a dict containing resource and policy
            projects_client.set_iam_policy(
                request={
                    "resource": project_name,
                    "policy": policy
                }
            )
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
        expected_metadata = provisioning_params.get("metadata", {})
        expected_tags = provisioning_params.get("network_tags", ["http-server", "https-server", "lb-server"])
        fault_config = provisioning_params.get("fault_configuration")

        unique_id = str(uuid4())[:8]
        max_suffix_len = 54  # 63 - 1 (dash) - 8 (uuid)
        truncated_suffix = name_suffix[:max_suffix_len]
        vm_name = f"{truncated_suffix}-{unique_id}"

        # Step 2.5: Determine VM configuration (apply faults during construction)
        # Start with baseline configuration
        vm_metadata = {"startup-script": script_value}
        vm_metadata.update(expected_metadata)
        vm_tags = list(expected_tags)

        # If fault_configuration exists, apply it during VM construction
        if fault_config:
            fault_type = fault_config.get("type")
            payload = fault_config.get("payload")

            if fault_type == "STARTUP_SCRIPT_CRASH":
                # Use faulty startup script from payload
                vm_metadata["startup-script"] = payload

            elif fault_type == "CORRUPT_METADATA":
                # Corrupt metadata by overwriting expected values
                if isinstance(payload, dict):
                    vm_metadata.update(payload)

            elif fault_type == "MISCONFIGURED_TAGS":
                # Use wrong tags from payload
                if isinstance(payload, list):
                    vm_tags = payload

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

        # Apply tags (possibly with fault injection)
        tags = compute_v1.Tags(items=vm_tags)
        instance.tags = tags

        # Apply metadata (possibly with fault injection)
        instance.metadata = compute_v1.Metadata(
            items=[compute_v1.Items(key=k, value=v) for k, v in vm_metadata.items()]
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
    def _inject_fault(instance_client, project: str, zone: str, vm_name: str, fault_config: dict):
        """Inject a fault into the provisioned VM.

        Modifies the live instance to create a deliberately broken environment.
        Called after VM is fully provisioned and ready.

        Args:
            instance_client: Compute API InstancesClient
            project: GCP project ID
            zone: GCP zone
            vm_name: Name of the VM to modify
            fault_config: dict with keys: type, payload, description

        Supported fault types:
        - STARTUP_SCRIPT_CRASH: payload is bash script that exits with error
        - CORRUPT_METADATA: payload is dict of {key: wrong_value}
        - MISCONFIGURED_TAGS: payload is list of wrong tags
        """
        if not fault_config:
            return

        fault_type = fault_config.get("type")
        payload = fault_config.get("payload")
        description = fault_config.get("description", "Unknown fault")

        print(f"[FAULT-INJECTION] Injecting {fault_type}: {description}")

        try:
            # Fetch current instance state
            instance = instance_client.get(project=project, zone=zone, instance=vm_name)

            if fault_type == "STARTUP_SCRIPT_CRASH":
                # Replace startup script with crashing version
                new_metadata = compute_v1.Metadata(
                    items=[compute_v1.Items(key="startup-script", value=payload)]
                )
                instance_client.set_metadata(
                    project=project,
                    zone=zone,
                    resource=vm_name,
                    metadata_resource=new_metadata
                )
                print(f"[FAULT-INJECTION] Startup script corrupted: {description}")

            elif fault_type == "CORRUPT_METADATA":
                # Overwrite metadata keys with wrong values
                current_metadata = {}
                if instance.metadata and instance.metadata.items:
                    current_metadata = {item.key: item.value for item in instance.metadata.items}

                # Apply corruption
                if isinstance(payload, dict):
                    current_metadata.update(payload)

                new_metadata = compute_v1.Metadata(
                    items=[compute_v1.Items(key=k, value=v) for k, v in current_metadata.items()]
                )
                instance_client.set_metadata(
                    project=project,
                    zone=zone,
                    resource=vm_name,
                    metadata_resource=new_metadata
                )
                print(f"[FAULT-INJECTION] Metadata corrupted: {description}")

            elif fault_type == "MISCONFIGURED_TAGS":
                # Replace tags with wrong ones
                if isinstance(payload, list):
                    instance.tags = compute_v1.Tags(items=payload)
                    instance_client.update(
                        project=project,
                        zone=zone,
                        instance=vm_name,
                        instance_resource=instance
                    )
                    print(f"[FAULT-INJECTION] Tags misconfigured: {description}")

        except Exception as e:
            print(f"[FAULT-INJECTION-ERROR] Failed to inject fault: {str(e)}")
            raise

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
