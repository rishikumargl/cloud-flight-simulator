# EvaluationResultSchema

**Producer:** P5 (Evaluation Service)  
**Consumers:** P1, P6

## Definition

```json
{
  "evaluation_id": "uuid (string)",
  "session_id": "uuid (string)",
  "submission_id": "uuid (string)",
  "status": "PASSED | FAILED | PARTIAL",
  "score": "number (0-100)",
  "deterministic_checks": {
    "passed": ["string"],
    "failed": ["string"]
  },
  "llm_assessment": {
    "understanding_score": "number (0-100)",
    "reasoning_quality": "string",
    "feedback_summary": "string"
  },
  "evaluated_at": "ISO 8601 timestamp (string)"
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `evaluation_id` | UUID | Yes | Unique evaluation identifier |
| `session_id` | UUID | Yes | Associated challenge session |
| `submission_id` | UUID | Yes | Submission being evaluated |
| `status` | String | Yes | Pass/fail status |
| `score` | Number | Yes | Overall score 0-100 |
| `deterministic_checks` | Object | Yes | Resource validation results |
| `llm_assessment` | Object | Yes | LLM-based understanding assessment |
| `evaluated_at` | Timestamp | Yes | Evaluation timestamp |

## Rules

- `status` must be one of: PASSED, FAILED, PARTIAL
- `score` is a weighted combination of deterministic and LLM results
- `deterministic_checks` contains hard pass/fail criteria (GCP resources)
- `llm_assessment` is optional if deterministic check failed completely
- Each submission has exactly one evaluation result

## Usage

Produced by:
- P5 Evaluation Service on `POST /evaluate/{session_id}/run`

Consumed by:
- P6 — For feedback generation
- P1 — To display results to learner
