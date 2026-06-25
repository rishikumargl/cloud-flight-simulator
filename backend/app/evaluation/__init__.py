"""Evaluation service domain — P5 owned.

Responsibilities:
- Fetch live GCP resource state
- Validate repairs against mission success criteria
- Compare expected state vs actual state
- Calculate weighted scores
- Persist evaluation results
- Support hybrid evaluation: deterministic (GCP resource checks) + LLM assessment
"""
