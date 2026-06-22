"""GCP Resource Inspector - fetches actual resource state from Google Cloud."""
import json
from typing import Optional, Dict, Any
from google.cloud import compute_v1
from google.cloud import storage
import logging

logger = logging.getLogger(__name__)


class ComputeResourceInspector:
    """Inspects Google Compute Engine resources."""

    def __init__(self):
        self.compute_client = compute_v1.InstancesClient()
        self.disk_client = compute_v1.DisksClient()
        self.firewall_client = compute_v1.FirewallsClient()

    def get_instance(self, project_id: str, zone: str, instance_name: str) -> Optional[Dict[str, Any]]:
        """Fetch VM instance details."""
        try:
            request = compute_v1.GetInstanceRequest(
                project=project_id,
                zone=zone,
                resource=instance_name,
            )
            instance = self.compute_client.get(request=request)
            return {
                "name": instance.name,
                "machine_type": instance.machine_type.split("/")[-1],
                "status": instance.status,
                "zone": instance.zone.split("/")[-1],
                "cpu_platform": instance.cpu_platform,
                "network_interfaces": [
                    {
                        "name": ni.name,
                        "network": ni.network.split("/")[-1],
                    }
                    for ni in instance.network_interfaces
                ],
            }
        except Exception as e:
            logger.warning(f"Instance {instance_name} not found: {e}")
            return None

    def get_disk(self, project_id: str, zone: str, disk_name: str) -> Optional[Dict[str, Any]]:
        """Fetch persistent disk details."""
        try:
            request = compute_v1.GetDiskRequest(
                project=project_id,
                resource=disk_name,
                zone=zone,
            )
            disk = self.disk_client.get(request=request)
            return {
                "name": disk.name,
                "size_gb": disk.size_gb,
                "status": disk.status,
                "type": disk.type.split("/")[-1],
            }
        except Exception as e:
            logger.warning(f"Disk {disk_name} not found: {e}")
            return None

    def get_firewall_rule(self, project_id: str, rule_name: str) -> Optional[Dict[str, Any]]:
        """Fetch firewall rule details."""
        try:
            request = compute_v1.GetFirewallRequest(
                project=project_id,
                resource=rule_name,
            )
            rule = self.firewall_client.get(request=request)
            return {
                "name": rule.name,
                "direction": rule.direction,
                "source_ranges": list(rule.source_ranges) if rule.source_ranges else [],
                "allowed": [
                    {
                        "protocol": allowed.IPProtocol,
                        "ports": list(allowed.ports) if allowed.ports else [],
                    }
                    for allowed in rule.allowed
                ],
                "target_tags": list(rule.target_tags) if rule.target_tags else [],
            }
        except Exception as e:
            logger.warning(f"Firewall rule {rule_name} not found: {e}")
            return None


class StorageResourceInspector:
    """Inspects Google Cloud Storage resources."""

    def __init__(self):
        self.storage_client = storage.Client()

    def get_bucket(self, bucket_name: str) -> Optional[Dict[str, Any]]:
        """Fetch GCS bucket details."""
        try:
            bucket = self.storage_client.bucket(bucket_name)
            if not bucket.exists():
                return None
            return {
                "name": bucket.name,
                "location": bucket.location,
                "storage_class": bucket.storage_class,
                "versioning_enabled": bucket.versioning_enabled,
                "object_count": sum(1 for _ in bucket.list_blobs()),
            }
        except Exception as e:
            logger.warning(f"Bucket {bucket_name} not found: {e}")
            return None

    def get_bucket_iam_policy(self, bucket_name: str) -> Optional[Dict[str, Any]]:
        """Fetch GCS bucket IAM policy."""
        try:
            bucket = self.storage_client.bucket(bucket_name)
            policy = bucket.iam_policy
            bindings = {}
            if policy and policy.bindings:
                for role, members in policy.bindings.items():
                    bindings[role] = list(members)
            return {"name": bucket_name, "bindings": bindings}
        except Exception as e:
            logger.warning(f"Could not fetch IAM policy for {bucket_name}: {e}")
            return None


class ResourceInspectorFactory:
    """Factory for creating resource inspectors."""

    _compute_inspector = None
    _storage_inspector = None

    @classmethod
    def get_compute_inspector(cls) -> ComputeResourceInspector:
        if cls._compute_inspector is None:
            cls._compute_inspector = ComputeResourceInspector()
        return cls._compute_inspector

    @classmethod
    def get_storage_inspector(cls) -> StorageResourceInspector:
        if cls._storage_inspector is None:
            cls._storage_inspector = StorageResourceInspector()
        return cls._storage_inspector
