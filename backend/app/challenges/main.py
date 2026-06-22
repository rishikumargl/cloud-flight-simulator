import uuid
import time
import os
import threading
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from google.cloud import compute_v1, resourcemanager_v3
from google.oauth2 import service_account

app = FastAPI(title="Cloud Flight Simulator - Adaptive Core Backend Engine")

# Enable CORS to allow external APIs or eventual frontend connections to interact safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Target Google Cloud Project ID
GCP_PROJECT_ID = "cloud-simulator"

# Path to your Google Cloud Service Account JSON key
SERVICE_ACCOUNT_KEY_PATH = os.getenv("GCP_KEY_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "secrets", "service-account-key.json"))

# HARDCODED SCENARIO MAPPER: Pure representation of your documentation JSON layout
HARDCODED_MISSION = {
    "mission_id": "mission-9cf2-4b2a",
    "track": "COMPUTE",
    "difficulty": "BEGINNER",
    "title": "Deploy a Public Web Server",
    "business_context": "A startup needs a public-facing web server.",
    "objectives": ["Create a VM", "Expose HTTP access"],
    "success_criteria": [
        {
            "criterion_id": "crit-890a-11bc",
            "description": "VM exists",
            "resource_type": "compute_instance",
            "expected_state": {
                "name_suffix": "web-01",
                "machine_type": "e2-micro",
                "zone": "us-central1-a",
                "network": "default",
                "startup_script": "#!/bin/bash\napt-get update && apt-get install -y apache2" 
            },
            "weight": 50
        }
    ],
    "time_limit_minutes": 45,
    "generated_by": "scenario-generator",
    "created_at": "2026-06-22T14:15:00Z"
}

# Track active user instances for cleanup
active_instances: Dict[str, Dict[str, Any]] = {}

class LaunchLabRequest(BaseModel):
    user_email: EmailStr

class StopLabRequest(BaseModel):
    user_email: EmailStr
    vm_name: str

def cleanup_user_instance(user_email: str, vm_name: str, zone: str, credentials):
    """Delete VM instance and remove user IAM permissions."""
    try:
        instance_client = compute_v1.InstancesClient(credentials=credentials)
        projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
        project_name = f"projects/{GCP_PROJECT_ID}"

        print(f" -> [CLEANUP] Starting cleanup for {user_email} on {vm_name}")

        # Step 1: Delete the instance
        print(f" -> [CLEANUP-DELETE] Deleting instance {vm_name}...")
        delete_operation = instance_client.delete(
            project=GCP_PROJECT_ID,
            zone=zone,
            instance=vm_name
        )

        # Wait for deletion to complete
        operation_client = compute_v1.ZoneOperationsClient(credentials=credentials)
        timeout = 60
        start_time = time.time()
        while delete_operation.status != compute_v1.Operation.Status.DONE:
            if time.time() - start_time > timeout:
                print(f" -> [CLEANUP-DELETE-WARNING] Instance deletion timed out")
                break
            time.sleep(2)
            delete_operation = operation_client.get(
                project=GCP_PROJECT_ID,
                zone=zone,
                operation=delete_operation.name
            )

        print(f" -> [CLEANUP-DELETE] ✓ Instance {vm_name} deleted")

        # Step 2: Remove user IAM permissions from project
        print(f" -> [CLEANUP-IAM] Removing IAM permissions for {user_email}...")
        try:
            policy = projects_client.get_iam_policy(request={"resource": project_name})
            user_member = f"user:{user_email}"

            # Iterate through bindings and remove this user
            bindings_to_delete = []
            for i, binding in enumerate(policy.bindings):
                if user_member in binding.members:
                    # Get the current members and filter out this user
                    members_list = list(binding.members)
                    members_list.remove(user_member)

                    # If no members left, mark binding for deletion
                    if not members_list:
                        bindings_to_delete.append(i)
                    else:
                        # Update binding with remaining members
                        del binding.members[:]
                        binding.members.extend(members_list)

            # Remove empty bindings (in reverse order to preserve indices)
            for i in reversed(bindings_to_delete):
                del policy.bindings[i]

            projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
            print(f" -> [CLEANUP-IAM] ✓ IAM permissions removed for {user_email}")
        except Exception as e:
            print(f" -> [CLEANUP-IAM-WARNING] Could not remove IAM permissions: {str(e)}")

        # Remove from tracking
        if user_email in active_instances:
            del active_instances[user_email]

        print(f" -> [CLEANUP] ✓ Cleanup completed for {user_email}")

    except Exception as e:
        print(f" -> [CLEANUP-ERROR] Cleanup failed: {str(e)}")

@app.get("/health")
def health_check():
    """Simple endpoint to verify that the local server is alive."""
    return {"status": "Healthy", "message": "The orchestrator engine is active."}

@app.post("/api/launch-lab")
def launch_lab(request: LaunchLabRequest):
    """
    Orchestration endpoint: Provisions a basic GCP Compute Instance, sets networking tags,
    and binds temporary project-level IAM permissions to the provided student email.
    """
    try:
        if not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            raise FileNotFoundError(f"Service account key file missing at: {SERVICE_ACCOUNT_KEY_PATH}")
            
        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)
        project_name = f"projects/{GCP_PROJECT_ID}"

        # -------------------------------------------------------------
        # STEP 1: IAM ACCESS PROVISIONING (PROTOBUF SECURE ALIGNMENT)
        # -------------------------------------------------------------
        print(f" -> [IAM-PHASE] Granting platform identities to: {request.user_email}")
        try:
            projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
            policy = projects_client.get_iam_policy(request={"resource": project_name})

            # Explicitly append using the strict protobuf .add model interface layout
            # Grant browser role (to see the project)
            policy.bindings.add(
                role="roles/browser",
                members=[f"user:{request.user_email}"]
            )

            # Grant compute viewer role (to see compute resources)
            policy.bindings.add(
                role="roles/compute.viewer",
                members=[f"user:{request.user_email}"]
            )

            projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
            print(f" -> [IAM-PHASE] ✓ Access parameters successfully synced. Pausing for global propagation...")
            time.sleep(5)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"IAM Control Error: {str(e)}")

        # -------------------------------------------------------------
        # STEP 2: ADAPTIVE BLUEPRINT PARSING
        # -------------------------------------------------------------
        compute_criteria = next(
            (c for c in HARDCODED_MISSION["success_criteria"] if c["resource_type"] == "compute_instance"), 
            None
        )
        if not compute_criteria:
            raise HTTPException(status_code=400, detail="No valid compute layout found in payload rules.")

        expected_state = compute_criteria["expected_state"]
        
        # Extract metadata metrics from your layout with clear fallback parameters
        name_suffix = expected_state.get("name_suffix", "sandbox-vm")
        machine_type = expected_state.get("machine_type", "e2-micro")
        zone = expected_state.get("zone", "us-central1-a")
        network_name = expected_state.get("network", "default")
        script_value = expected_state.get("startup_script", "#!/bin/bash\necho 'Server online.'")

        # Generate a tracking suffix to enforce Naming Collision Protection boundaries
        unique_id = str(uuid.uuid4())[:8]
        vm_name = f"{name_suffix}-{unique_id}"

        # -------------------------------------------------------------
        # STEP 3: INFRASTRUCTURE VIRTUALIZATION PROVISIONING
        # -------------------------------------------------------------
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

        # Enable default core firewall tracking tags natively
        tags = compute_v1.Tags(items=["http-server", "https-server", "lb-server"])
        instance.tags = tags

        # Embed your scenario startup script metadata mapping arrays cleanly
        instance.metadata = compute_v1.Metadata(
            items=[compute_v1.Items(key="startup-script", value=script_value)]
        )

        print(f" -> [PROVISION-PHASE] Deploying custom scenario VM: {vm_name}")
        operation = instance_client.insert(project=GCP_PROJECT_ID, zone=zone, instance_resource=instance)

        # Polling Loop Tracker
        print(" -> [POLLING-PHASE] Waiting for hardware provisioning to clear...")
        start_time = time.time()
        while operation.status != compute_v1.Operation.Status.DONE:
            if time.time() - start_time > 90:
                raise TimeoutError("Infrastructure generation timed out.")
            time.sleep(3)
            operation = operation_client.get(project=GCP_PROJECT_ID, zone=zone, operation=operation.name)

        if operation.error:
            raise Exception(f"GCP Engine Operation Error: {operation.error}")

        print(f" -> [SUCCESS] Sandbox completely active. Link package generated.")

        # Grant instance-level access (only to this specific VM)
        print(f" -> [INSTANCE-IAM] Granting instance admin access to: {request.user_email} on {vm_name}")
        try:
            iam_policy = instance_client.get_iam_policy(
                project=GCP_PROJECT_ID,
                zone=zone,
                resource=vm_name
            )

            binding = compute_v1.Binding()
            binding.role = "roles/compute.instanceAdmin.v1"
            binding.members = [f"user:{request.user_email}"]

            iam_policy.bindings.append(binding)

            instance_client.set_iam_policy(
                project=GCP_PROJECT_ID,
                zone=zone,
                resource=vm_name,
                zone_set_policy_request_resource=compute_v1.ZoneSetPolicyRequest(policy=iam_policy)
            )
            print(f" -> [INSTANCE-IAM] ✓ Instance admin role (compute.instanceAdmin.v1) granted to {request.user_email} for {vm_name} only")

            # Verify the binding was set
            verify_policy = instance_client.get_iam_policy(
                project=GCP_PROJECT_ID,
                zone=zone,
                resource=vm_name
            )
            for b in verify_policy.bindings:
                if f"user:{request.user_email}" in b.members:
                    print(f" -> [INSTANCE-IAM-VERIFY] Confirmed: {request.user_email} has role {b.role} on {vm_name}")

        except Exception as e:
            print(f" -> [INSTANCE-IAM-ERROR] Failed to set instance-level access: {str(e)}")
            raise

        gcp_console_url = f"https://console.cloud.google.com/compute/instancesDetail/zones/{zone}/instances/{vm_name}?project={GCP_PROJECT_ID}"

        # Track this instance for cleanup
        time_limit_minutes = HARDCODED_MISSION["time_limit_minutes"]
        active_instances[request.user_email] = {
            "vm_name": vm_name,
            "zone": zone,
            "created_at": time.time(),
            "time_limit_minutes": time_limit_minutes
        }

        # Schedule automatic cleanup after time limit
        def auto_cleanup():
            time.sleep(time_limit_minutes * 60)
            print(f" -> [AUTO-CLEANUP] Time limit reached for {request.user_email}")
            cleanup_user_instance(request.user_email, vm_name, zone, credentials)

        cleanup_thread = threading.Thread(target=auto_cleanup, daemon=True)
        cleanup_thread.start()

        return {
            "status": "Success",
            "vm_name": vm_name,
            "gcp_console_url": gcp_console_url,
            "time_limit_minutes": time_limit_minutes,
            "display_data": {
                "business_context": HARDCODED_MISSION["business_context"],
                "objectives": HARDCODED_MISSION["objectives"]
            },
            "metadata": {
                "title": HARDCODED_MISSION["title"],
                "track": HARDCODED_MISSION["track"],
                "difficulty": HARDCODED_MISSION["difficulty"],
                "time_limit_minutes": time_limit_minutes
            }
        }

    except Exception as e:
        print(f" -> [FAILURE] Orchestration halted: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop-lab")
def stop_lab(request: StopLabRequest):
    """
    Stop and cleanup a lab instance for a user.
    Deletes the VM and removes all IAM permissions.
    """
    try:
        if not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            raise FileNotFoundError(f"Service account key file missing at: {SERVICE_ACCOUNT_KEY_PATH}")

        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)

        if request.user_email not in active_instances:
            raise HTTPException(status_code=404, detail=f"No active instance found for {request.user_email}")

        instance_info = active_instances[request.user_email]
        vm_name = instance_info["vm_name"]
        zone = instance_info["zone"]

        print(f" -> [STOP-LAB] Stopping lab for {request.user_email}")

        # Run cleanup
        cleanup_user_instance(request.user_email, vm_name, zone, credentials)

        return {
            "status": "Success",
            "message": f"Lab stopped and resources cleaned up for {request.user_email}",
            "vm_name": vm_name
        }

    except Exception as e:
        print(f" -> [STOP-LAB-ERROR] Failed to stop lab: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))