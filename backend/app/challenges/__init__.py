"""Challenge service domain — P4 owned.

Responsibilities:
- Provision GCP Compute Engine environments for challenge sessions
- Manage VM lifecycle (create, configure, destroy)
- Inject faults into VMs for incident-response scenarios
- Handle IAM bindings and access control
- Schedule automatic cleanup after time limit
"""
