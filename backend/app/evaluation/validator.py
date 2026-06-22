"""Deterministic validation engine - checks resource_snapshot against expected state."""
from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)


class DeterministicValidator:
    """Validates GCP resources against success criteria."""

    def validate_compute_instance(
        self,
        resource_snapshot: Dict[str, Any],
        expected_state: Dict[str, Any],
    ) -> bool:
        """Validate VM instance matches expected state."""
        if not resource_snapshot or not resource_snapshot.get("name"):
            return False

        # Check name suffix
        expected_suffix = expected_state.get("name_suffix", "")
        if not resource_snapshot["name"].endswith(expected_suffix):
            return False

        # Check machine type (if specified)
        if "machine_type" in expected_state:
            expected_machine = expected_state["machine_type"]
            actual_machine = resource_snapshot.get("machine_type", "")
            if actual_machine != expected_machine:
                return False

        # Check status is RUNNING
        if resource_snapshot.get("status") != "RUNNING":
            return False

        return True

    def validate_persistent_disk(
        self,
        resource_snapshot: Dict[str, Any],
        expected_state: Dict[str, Any],
    ) -> bool:
        """Validate persistent disk matches expected state."""
        if not resource_snapshot or not resource_snapshot.get("name"):
            return False

        # Check name suffix
        expected_suffix = expected_state.get("name_suffix", "")
        if not resource_snapshot["name"].endswith(expected_suffix):
            return False

        # Check size (if specified)
        if "size_gb" in expected_state:
            if resource_snapshot.get("size_gb") != expected_state["size_gb"]:
                return False

        return True

    def validate_firewall_rule(
        self,
        resource_snapshot: Dict[str, Any],
        expected_state: Dict[str, Any],
    ) -> bool:
        """Validate firewall rule matches expected state."""
        if not resource_snapshot or not resource_snapshot.get("name"):
            return False

        # Check name suffix
        expected_suffix = expected_state.get("name_suffix", "")
        if not resource_snapshot["name"].endswith(expected_suffix):
            return False

        # Check allowed protocols/ports (if specified)
        if "allowed" in expected_state:
            expected_allowed = expected_state["allowed"]
            actual_allowed = resource_snapshot.get("allowed", [])
            if not actual_allowed:
                return False
            # Basic check: at least one protocol matches
            actual_protocols = {a["protocol"] for a in actual_allowed}
            expected_protocols = {a.get("protocol") for a in expected_allowed if "protocol" in a}
            if expected_protocols and not actual_protocols.intersection(expected_protocols):
                return False

        return True

    def validate_storage_bucket(
        self,
        resource_snapshot: Dict[str, Any],
        expected_state: Dict[str, Any],
    ) -> bool:
        """Validate GCS bucket matches expected state."""
        if not resource_snapshot or not resource_snapshot.get("name"):
            return False

        # Check name suffix (with random suffix handling)
        expected_suffix = expected_state.get("name_suffix", "")
        if expected_suffix and not resource_snapshot["name"].startswith(expected_suffix):
            return False

        # Check versioning (if specified)
        if "versioning_enabled" in expected_state:
            if resource_snapshot.get("versioning_enabled") != expected_state["versioning_enabled"]:
                return False

        return True

    def validate_criterion(
        self,
        resource_type: str,
        resource_snapshot: Dict[str, Any],
        expected_state: Dict[str, Any],
    ) -> bool:
        """Validate a single criterion."""
        if resource_type == "compute_instance":
            return self.validate_compute_instance(resource_snapshot, expected_state)
        elif resource_type == "persistent_disk":
            return self.validate_persistent_disk(resource_snapshot, expected_state)
        elif resource_type == "firewall_rule":
            return self.validate_firewall_rule(resource_snapshot, expected_state)
        elif resource_type == "storage_bucket":
            return self.validate_storage_bucket(resource_snapshot, expected_state)
        else:
            logger.warning(f"Unknown resource type: {resource_type}")
            return False
