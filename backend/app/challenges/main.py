import uuid
import time
import os
import threading
from typing import List, Dict, Any, Optional
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from google.cloud import compute_v1, resourcemanager_v3
from google.oauth2 import service_account
from google.type import expr_pb2
from google.iam.v1 import policy_pb2
from google.iam.v1 import iam_policy_pb2
from google.iam.v1 import options_pb2

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(title="Cloud Flight Simulator - Production Incident Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "cloud-simulator")
_key_path = os.getenv("GCP_KEY_PATH", "../secrets/service-account-key.json")
if not os.path.isabs(_key_path):
    _app_root = Path(__file__).parent.parent.parent.parent
    _key_path = _app_root / _key_path
SERVICE_ACCOUNT_KEY_PATH = str(_key_path)

active_labs: Dict[str, Dict[str, Dict[str, Any]]] = {}

# --- TYPE-SAFE SCHEMAS ---

class FaultConfiguration(BaseModel):
    type: str
    payload: Optional[Any] = None
    description: Optional[str] = None

class SuccessCriterion(BaseModel):
    criterion_id: str
    description: str
    resource_type: str
    expected_state: Dict[str, Any]
    weight: int
    fault_configuration: Optional[FaultConfiguration] = None

class MissionData(BaseModel):
    track: str
    difficulty: str
    level: str
    title: str
    business_context: str
    time_limit_minutes: int
    required_iam_roles: List[str]
    resources_affected: int
    involves_networking: bool
    objectives: List[str]
    success_criteria: List[SuccessCriterion]
    mission_id: str
    generated_by: str
    created_at: str

class LaunchLabRequest(BaseModel):
    user_email: EmailStr
    scenario_payload: Dict[str, Any]

class VerifyLabRequest(BaseModel):
    user_email: EmailStr
    mission_id: str
    scenario_payload: Dict[str, Any]

class StopLabRequest(BaseModel):
    user_email: EmailStr
    mission_id: str


# --- INFRASTRUCTURE CLEANUP JANITOR ---

def execute_lab_cleanup(user_email: str, mission_id: str, lab_manifest: Dict[str, Any], credentials):
    try:
        instance_client = compute_v1.InstancesClient(credentials=credentials)
        projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
        project_name = f"projects/{GCP_PROJECT_ID}"
        
        # Step 1: Drop VM Instances
        for item in lab_manifest.get("allocated_vms", []):
            try:
                print(f" -> [TEARDOWN] Dropping instance {item['name']}...")
                instance_client.delete(project=GCP_PROJECT_ID, zone=item['zone'], instance=item['name'])
            except Exception as e:
                print(f" -> [TEARDOWN-ERROR] Failed: {str(e)}")

        # Step 2: Dynamically clean up Project-level IAM Roles for this user
        print(f" -> [CLEANUP-IAM] Removing project-level IAM permissions for {user_email}...")
        try:
            policy = projects_client.get_iam_policy(request={"resource": project_name})
            user_member = f"user:{user_email}"

            bindings_to_delete = []
            for i, binding in enumerate(policy.bindings):
                if user_member in binding.members:
                    members_list = list(binding.members)
                    members_list.remove(user_member)

                    if not members_list:
                        bindings_to_delete.append(i)
                    else:
                        del binding.members[:]
                        binding.members.extend(members_list)

            for i in reversed(bindings_to_delete):
                del policy.bindings[i]

            projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
            print(f" -> [CLEANUP-IAM] ✓ IAM permissions swept for {user_email}")
        except Exception as e:
            print(f" -> [CLEANUP-IAM-WARNING] Could not remove project-level IAM permissions: {str(e)}")

        # Step 3: Evict from local manifest tracking ledger
        if user_email in active_labs and mission_id in active_labs[user_email]:
            del active_labs[user_email][mission_id]
            if not active_labs[user_email]:
                del active_labs[user_email]
    except Exception as e:
        print(f" -> [CRITICAL-TEARDOWN-FAILURE] Janitor crash: {str(e)}")


# --- ENDPOINTS ---

@app.post("/api/launch-lab")
def launch_lab(request: LaunchLabRequest):
    try:
        raw_data = request.scenario_payload.get("data", {})
        if not raw_data:
            raise HTTPException(status_code=400, detail="Missing 'data' wrapper.")

        mission = MissionData(**raw_data)

        credentials = None
        if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)

        project_name = f"projects/{GCP_PROJECT_ID}"
        user_member = f"user:{request.user_email}"

        # -------------------------------------------------------------
        # STEP 1: IAM ACCESS PROVISIONING (PROJECT-LEVEL BINDINGS)
        # -------------------------------------------------------------
        if credentials:
            print(f" -> [IAM-PHASE] Granting platform identities to: {request.user_email}")
            try:
                projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
                policy = projects_client.get_iam_policy(request={"resource": project_name})

                # Append core layout view-rights natively using protobuf .add patterns
                policy.bindings.add(
                    role="roles/browser",
                    members=[user_member]
                )
                policy.bindings.add(
                    role="roles/compute.viewer",
                    members=[user_member]
                )

                projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
                print(f" -> [IAM-PHASE] ✓ Access parameters successfully synced. Pausing for propagation...")
                time.sleep(5)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Project IAM Control Error: {str(e)}")

        instance_client = compute_v1.InstancesClient(credentials=credentials)
        unique_id = str(uuid.uuid4())[:8]

        lab_manifest = {
            "mission_id": mission.mission_id,
            "allocated_vms": [],
            "roles": mission.required_iam_roles,
            "created_at": time.time(),
            "unique_id": unique_id
        }

        primary_console_url = None
        built_suffixes = set()

        for criterion in mission.success_criteria:
            if criterion.resource_type == "compute_instance":
                state = criterion.expected_state
                suffix = state.get("name_suffix", "target")

                if suffix in built_suffixes:
                    continue

                fault = criterion.fault_configuration
                vm_name = f"{suffix}-{unique_id}"
                zone = state.get("zone", "us-central1-a")

                instance = compute_v1.Instance()
                instance.name = vm_name
                instance.machine_type = f"zones/{zone}/machineTypes/{state.get('machine_type', 'e2-micro')}"

                boot_disk = compute_v1.AttachedDisk(
                    boot=True,
                    auto_delete=True,
                    type_=compute_v1.AttachedDisk.Type.PERSISTENT.name,
                    initialize_params=compute_v1.AttachedDiskInitializeParams(
                        source_image=state.get("boot_image", "projects/debian-cloud/global/images/family/debian-11"),
                        disk_size_gb=state.get("disk_size_gb", 10)
                    )
                )
                instance.disks = [boot_disk]

                network_name = state.get("network", "default")
                network_uri = network_name if network_name.startswith("projects/") else f"projects/{GCP_PROJECT_ID}/global/networks/{network_name}"

                net_interface = compute_v1.NetworkInterface(network=network_uri)
                net_interface.access_configs = [compute_v1.AccessConfig(
                    name="External NAT",
                    type_=compute_v1.AccessConfig.Type.ONE_TO_ONE_NAT.name
                )]
                instance.network_interfaces = [net_interface]

                network_tags = state.get("network_tags", [])
                metadata_items = []

                raw_metadata = state.get("metadata", {})
                for k, v in raw_metadata.items():
                    metadata_items.append(compute_v1.Items(key=k, value=str(v)))

                if fault:
                    if fault.type == "STARTUP_SCRIPT_CRASH":
                        metadata_items.append(compute_v1.Items(key="startup-script", value=str(fault.payload)))
                    elif fault.type in ["CORRUPT_METADATA", "INCORRECT_METADATA"] and isinstance(fault.payload, dict):
                        for k, v in fault.payload.items():
                            metadata_items = [i for i in metadata_items if i.key != k]
                            metadata_items.append(compute_v1.Items(key=k, value=str(v)))
                    elif fault.type == "MISCONFIGURED_TAGS" and isinstance(fault.payload, list):
                        network_tags = fault.payload

                instance.metadata = compute_v1.Metadata(items=metadata_items)
                if network_tags:
                    instance.tags = compute_v1.Tags(items=network_tags)

                if credentials:
                    print(f" -> [PROVISION-PHASE] Deploying custom scenario VM: {vm_name}")
                    operation = instance_client.insert(project=GCP_PROJECT_ID, zone=zone, instance_resource=instance)
                    operation.result()

                    # -------------------------------------------------------------
                    # STEP 2: INSTANCE-LEVEL ACCESS PROVISIONING (RESOURCE-SPECIFIC)
                    # -------------------------------------------------------------
                    print(f" -> [INSTANCE-IAM] Granting instance admin access to: {request.user_email} on {vm_name}")
                    try:
                        iam_policy = instance_client.get_iam_policy(
                            project=GCP_PROJECT_ID,
                            zone=zone,
                            resource=vm_name
                        )

                        binding = compute_v1.Binding()
                        binding.role = "roles/compute.instanceAdmin.v1"
                        binding.members = [user_member]

                        iam_policy.bindings.append(binding)

                        instance_client.set_iam_policy(
                            project=GCP_PROJECT_ID,
                            zone=zone,
                            resource=vm_name,
                            zone_set_policy_request_resource=compute_v1.ZoneSetPolicyRequest(policy=iam_policy)
                        )
                        print(f" -> [INSTANCE-IAM] ✓ Instance admin role explicitly granted on {vm_name}")
                    except Exception as e:
                        print(f" -> [INSTANCE-IAM-ERROR] Failed to set instance-level access: {str(e)}")

                lab_manifest["allocated_vms"].append({"name": vm_name, "zone": zone, "suffix": suffix})
                built_suffixes.add(suffix)

                if not primary_console_url:
                    primary_console_url = f"https://console.cloud.google.com/compute/instancesDetail/zones/{zone}/instances/{vm_name}?project={GCP_PROJECT_ID}"

        if request.user_email not in active_labs:
            active_labs[request.user_email] = {}
        active_labs[request.user_email][mission.mission_id] = lab_manifest

        def lab_janitor_daemon():
            time.sleep(mission.time_limit_minutes * 60)
            if credentials:
                execute_lab_cleanup(request.user_email, mission.mission_id, lab_manifest, credentials)

        threading.Thread(target=lab_janitor_daemon, daemon=True).start()

        return {
            "status": "Success",
            "gcp_console_url": primary_console_url,
            "allocated_vm_names": [v["name"] for v in lab_manifest["allocated_vms"]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/verify-lab")
def verify_lab(request: VerifyLabRequest):
    user_email = request.user_email
    mission_id = request.mission_id

    if user_email not in active_labs or mission_id not in active_labs[user_email]:
        raise HTTPException(status_code=404, detail="No active lab allocation session found for user.")

    manifest = active_labs[user_email][mission_id]

    raw_data = request.scenario_payload.get("data", {})
    mission = MissionData(**raw_data)

    credentials = None
    if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)

    if not credentials:
        return {"status": "Evaluated", "total_score": 100, "summary": "Dev Environment Mock Pass"}

    instance_client = compute_v1.InstancesClient(credentials=credentials)

    total_score = 0
    max_score = 0
    breakdown = []
    evaluation_logs = []

    vms_by_suffix = {v["suffix"]: v for v in manifest["allocated_vms"]}

    for criterion in mission.success_criteria:
        max_score += criterion.weight
        expected = criterion.expected_state
        suffix = expected.get("name_suffix")
        vm_meta = vms_by_suffix.get(suffix)

        if not vm_meta:
            evaluation_logs.append(f"[ERROR] Tracked VM with suffix '{suffix}' not found in active ledger.")
            breakdown.append({"criterion_id": criterion.criterion_id, "passed": False, "reason": "Resource missing"})
            continue

        try:
            evaluation_logs.append(f"[INFO] Fetching live state for target instance: {vm_meta['name']} ({vm_meta['zone']})")
            live_instance = instance_client.get(project=GCP_PROJECT_ID, zone=vm_meta["zone"], instance=vm_meta["name"])

            step_passed = True
            mismatches = []

            if "metadata" in expected:
                live_metadata = {item.key: item.value for item in live_instance.metadata.items}
                evaluation_logs.append(f"[INFO] Auditing metadata keys. Found live: {list(live_metadata.keys())}")

                for exp_key, exp_val in expected["metadata"].items():
                    if live_metadata.get(exp_key) != str(exp_val):
                        step_passed = False
                        mismatches.append(f"Metadata key '{exp_key}' expected '{exp_val}', found '{live_metadata.get(exp_key)}'")

                if not expected["metadata"] and "startup-script" in live_metadata:
                    step_passed = False
                    mismatches.append("Faulty 'startup-script' metadata key still exists on the instance.")

            if "status" in expected:
                evaluation_logs.append(f"[INFO] Auditing VM lifecycle status. Expected: {expected['status']}, Live: {live_instance.status}")
                if live_instance.status != expected["status"]:
                    step_passed = False
                    mismatches.append(f"Lifecycle state mismatch. Expected '{expected['status']}', found '{live_instance.status}'")

            if step_passed:
                total_score += criterion.weight
                evaluation_logs.append(f"[SUCCESS] Criterion '{criterion.criterion_id}' passed validation matching all baseline parameters.")
                breakdown.append({"criterion_id": criterion.criterion_id, "passed": True, "score_earned": criterion.weight})
            else:
                evaluation_logs.append(f"[FAILURE] Criterion '{criterion.criterion_id}' failed due to: {'; '.join(mismatches)}")
                breakdown.append({"criterion_id": criterion.criterion_id, "passed": False, "reason": mismatches})

        except Exception as api_err:
            evaluation_logs.append(f"[CRITICAL] API communication exception reading properties: {str(api_err)}")
            breakdown.append({"criterion_id": criterion.criterion_id, "passed": False, "reason": "API Failure"})

    return {
        "status": "Evaluated",
        "total_score": int((total_score / max_score) * 100) if max_score > 0 else 0,
        "evaluation_summary": "User successfully resolved the incident by scrubbing the corrupt startup-script metadata." if total_score == max_score else "Incident unresolved.",
        "breakdown": breakdown,
        "evaluation_logs": evaluation_logs
    }


@app.post("/api/stop-lab")
def stop_lab(request: StopLabRequest):
    user_email = request.user_email
    mission_id = request.mission_id

    if user_email not in active_labs or mission_id not in active_labs[user_email]:
        raise HTTPException(status_code=404, detail="Active lab configuration tracking not found.")

    credentials = None
    if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)

    execute_lab_cleanup(user_email, mission_id, active_labs[user_email][mission_id], credentials)
    return {"status": "Success", "message": "Infrastructure swept successfully."}