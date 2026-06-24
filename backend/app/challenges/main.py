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

# =========================================================================
# CENTRAL MULTI-USER MULTI-LAB LEDGER TRACKER
# Structure: 
# active_labs = {
#    "user1@company.com": {
#         "mission-uuid-1111": { ...lab_manifest... },
#         "mission-uuid-2222": { ...lab_manifest... }
#    }
# }
# =========================================================================
active_labs: Dict[str, Dict[str, Dict[str, Any]]] = {}


# --- TYPE-SAFE SCHEMAS FOR SCENARIO ARCHITECTURES ---

class FaultConfiguration(BaseModel):
    type: str  # "STARTUP_SCRIPT_CRASH", "CORRUPT_METADATA", "MISCONFIGURED_TAGS"
    payload: Optional[Any] = None

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
    scenario_payload: Dict[str, Any]  # Enforced payload input

class StopLabRequest(BaseModel):
    user_email: EmailStr
    mission_id: str


# --- MULTI-TENANT CLEANUP DAEMON LAYER ---

def execute_lab_cleanup(user_email: str, mission_id: str, lab_manifest: Dict[str, Any], credentials):
    """Sweeps allocated VMs and clears user bindings safely without breaking parallel labs."""
    try:
        instance_client = compute_v1.InstancesClient(credentials=credentials)
        projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
        project_name = f"projects/{GCP_PROJECT_ID}"

        print(f" -> [TEARDOWN] Purging sandbox for {user_email} | Mission: {mission_id}")

        # Delete instances bound to this specific lab allocation
        for item in lab_manifest.get("allocated_vms", []):
            try:
                print(f" -> [TEARDOWN-COMPUTE] Dropping instance {item['name']} from zone {item['zone']}...")
                instance_client.delete(project=GCP_PROJECT_ID, zone=item['zone'], instance=item['name'])
            except Exception as e:
                print(f" -> [TEARDOWN-ERROR] VM dropped failed: {str(e)}")

        # Clear IAM user bindings
        try:
            policy = projects_client.get_iam_policy(request={"resource": project_name})
            member_string = f"user:{user_email}"
            
            # Gather roles that need checking
            roles_to_check = lab_manifest.get("roles", [])
            
            # Look at remaining active labs for this exact same user to avoid stripping 
            # access roles they might still need for another parallel active challenge!
            shared_user_labs = active_labs.get(user_email, {})
            retained_roles = set()
            for m_id, manifest in shared_user_labs.items():
                if m_id != mission_id:
                    retained_roles.update(manifest.get("roles", []))

            for binding in policy.bindings:
                if binding.role in roles_to_check and binding.role not in retained_roles:
                    if member_string in binding.members:
                        binding.members.remove(member_string)

            projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
            print(f" -> [TEARDOWN-IAM] IAM reclamation checked/cleared.")
        except Exception as e:
            print(f" -> [TEARDOWN-IAM-ERROR] IAM cleanup broken: {str(e)}")

        # Clean ledger nodes safely
        if user_email in active_labs and mission_id in active_labs[user_email]:
            del active_labs[user_email][mission_id]
            if not active_labs[user_email]:
                del active_labs[user_email]

    except Exception as e:
        print(f" -> [CRITICAL-TEARDOWN-FAILURE] Scavenger crash: {str(e)}")


# --- MAIN ORCHESTRATOR ENDPOINT ---

@app.post("/api/launch-lab")
def launch_lab(request: LaunchLabRequest):
    try:
        raw_data = request.scenario_payload.get("data", {})
        if not raw_data:
            raise HTTPException(status_code=400, detail="Malformed structure. 'data' wrapper missing.")
        
        mission = MissionData(**raw_data)
        
        if not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            print(f" -> [DEV-MODE] Running without real GCP credentials")
            credentials = None
        else:
            credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)
        
        project_name = f"projects/{GCP_PROJECT_ID}"
        projects_client = resourcemanager_v3.ProjectsClient(credentials=credentials)
        instance_client = compute_v1.InstancesClient(credentials=credentials)

        # Unique hash suffix prevents collisions between multiple users or multiple runs of the same lab
        unique_id = str(uuid.uuid4())[:8]
        
        lab_manifest = {
            "mission_id": mission.mission_id,
            "allocated_vms": [],
            "roles": mission.required_iam_roles,
            "created_at": time.time()
        }

        # -------------------------------------------------------------
        # STEP 1: IAM ALLOCATION FOR USER
        # -------------------------------------------------------------
        if credentials:
            try:
                policy = projects_client.get_iam_policy(request={"resource": project_name})
                user_member = f"user:{request.user_email}"

                for role in mission.required_iam_roles:
                    found = False
                    for binding in policy.bindings:
                        if binding.role == role:
                            if user_member not in binding.members:
                                binding.members.append(user_member)
                            found = True
                            break
                    if not found:
                        policy.bindings.add(role=role, members=[user_member])

                projects_client.set_iam_policy(request={"resource": project_name, "policy": policy})
                time.sleep(1)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"IAM Allocation Fault: {str(e)}")

        # -------------------------------------------------------------
        # STEP 2: DYNAMIC INSTANCE FABRICATION LOOP
        # -------------------------------------------------------------
        primary_console_url = None

        for criterion in mission.success_criteria:
            if criterion.resource_type == "compute_instance":
                state = criterion.expected_state
                fault = criterion.fault_configuration
                
                vm_name = f"{state.get('name_suffix', 'target')}-{unique_id}"
                zone = state.get("zone", "us-central1-a")
                
                instance = compute_v1.Instance()
                instance.name = vm_name
                instance.machine_type = f"zones/{zone}/machineTypes/{state.get('machine_type', 'e2-micro')}"
                
                # Disks block
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

                # Networking Network Interfacing & Target Custom Routing Setup
                network_name = state.get("network", "default")
                network_uri = network_name if network_name.startswith("projects/") else f"projects/{GCP_PROJECT_ID}/global/networks/{network_name}"
                
                net_interface = compute_v1.NetworkInterface(network=network_uri)
                if state.get("ssh_accessible", True):
                    net_interface.access_configs = [compute_v1.AccessConfig(
                        name="External NAT",
                        type_=compute_v1.AccessConfig.Type.ONE_TO_ONE_NAT.name
                    )]
                instance.network_interfaces = [net_interface]

                # Setup dynamic target network tags (Crucial for L2 / L3 Firewall isolation tasks)
                network_tags = state.get("network_tags", [])
                
                # Setup metadata structures
                metadata_items = []
                raw_metadata = state.get("metadata", {})
                for k, v in raw_metadata.items():
                    metadata_items.append(compute_v1.Items(key=k, value=str(v)))

                # -------------------------------------------------------------
                # DECOUPLED FAULT CONFIGURATION INJECTION ENGINE
                # -------------------------------------------------------------
                if fault:
                    if fault.type == "STARTUP_SCRIPT_CRASH":
                        metadata_items.append(compute_v1.Items(key="startup-script", value=str(fault.payload)))
                    elif fault.type == "CORRUPT_METADATA" and isinstance(fault.payload, dict):
                        for k, v in fault.payload.items():
                            metadata_items.append(compute_v1.Items(key=k, value=str(v)))
                    elif fault.type == "MISCONFIGURED_TAGS" and isinstance(fault.payload, list):
                        # Overwrite or mutate standard tags with the broken ones for users to clear
                        network_tags = fault.payload

                # Set structural elements back to instance object
                instance.metadata = compute_v1.Metadata(items=metadata_items)
                if network_tags:
                    instance.tags = compute_v1.Tags(items=network_tags)

                # Attach specific Service Account Identities if parsed (L3 Target Contexts)
                sa_setup = state.get("service_account_setup")
                if sa_setup:
                    instance.service_accounts = [compute_v1.ServiceAccount(
                        email=sa_setup.get("email"),
                        scopes=sa_setup.get("scopes", ["https://www.googleapis.com/auth/cloud-platform"])
                    )]

                # Issue provisioning execution via API client
                if credentials:
                    print(f" -> [ORCHESTRATOR] Spawning real node: {vm_name}")
                    instance_client.insert(project=GCP_PROJECT_ID, zone=zone, instance_resource=instance)
                
                lab_manifest["allocated_vms"].append({"name": vm_name, "zone": zone})
                
                if not primary_console_url:
                    primary_console_url = f"https://console.cloud.google.com/compute/instancesDetail/zones/{zone}/instances/{vm_name}?project={GCP_PROJECT_ID}"

        # Insert securely to memory ledger mapped under separate users & missions
        if request.user_email not in active_labs:
            active_labs[request.user_email] = {}
        active_labs[request.user_email][mission.mission_id] = lab_manifest

        # Timed Janitor daemon thread tracking
        def lab_janitor_daemon():
            time.sleep(mission.time_limit_minutes * 60)
            if credentials:
                execute_lab_cleanup(request.user_email, mission.mission_id, lab_manifest, credentials)

        scavenger = threading.Thread(target=lab_janitor_daemon, daemon=True)
        scavenger.start()

        return {
            "status": "Success",
            "gcp_console_url": primary_console_url,
            "allocated_vm_names": [v["name"] for v in lab_manifest["allocated_vms"]],
            "display_data": {
                "title": mission.title,
                "level": mission.level,
                "objectives": mission.objectives
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stop-lab")
def stop_lab(request: StopLabRequest):
    user_email = request.user_email
    mission_id = request.mission_id

    if user_email not in active_labs or mission_id not in active_labs[user_email]:
        raise HTTPException(status_code=404, detail="Active lab variant configuration not found.")

    if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY_PATH)
    else:
        credentials = None

    execute_lab_cleanup(user_email, mission_id, active_labs[user_email][mission_id], credentials)
    return {"status": "Success", "message": "Infrastructure swept successfully."}