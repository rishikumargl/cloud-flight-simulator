"""Hard scoring gate and point calculation - enforces resource_met gate."""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class ScoringGate:
    """Applies hard scoring rule: if resource_met=false, points_awarded=0."""

    @staticmethod
    def calculate_points(
        resource_met: bool,
        understanding_score: int,
        weight: int,
    ) -> int:
        """
        Calculate points awarded for a criterion.

        Critical Rule (HARD GATE):
        If resource_met == False, then points_awarded MUST be 0.
        Otherwise: points_awarded = round(weight * (understanding_score / 100))
        """
        if not resource_met:
            return 0

        # Resource exists and is correct - award points based on understanding
        points = round(weight * (understanding_score / 100))
        return points

    @staticmethod
    def calculate_percentage(criteria_results: List[Dict[str, Any]]) -> float:
        """
        Calculate overall percentage.

        percentage = (sum of points_awarded / sum of weights) * 100
        """
        total_points = sum(c.get("points_awarded", 0) for c in criteria_results)
        total_weight = sum(c.get("weight", 0) for c in criteria_results)

        if total_weight == 0:
            return 0.0

        percentage = (total_points / total_weight) * 100
        return round(percentage, 2)
