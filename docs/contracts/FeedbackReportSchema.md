# FeedbackReportSchema

**Producer:** P6 (Feedback Service)  
**Consumers:** P1

## Definition

```json
{
  "feedback_id": "uuid (string)",
  "session_id": "uuid (string)",
  "evaluation_id": "uuid (string)",
  "user_id": "uuid (string)",
  "status": "PASSED | NEEDS_IMPROVEMENT | FAILED",
  "overall_feedback": "string",
  "areas_of_strength": ["string"],
  "areas_for_improvement": ["string"],
  "suggestions": ["string"],
  "learning_resources": [
    {
      "title": "string",
      "url": "string",
      "topic": "string"
    }
  ],
  "generated_at": "ISO 8601 timestamp (string)"
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `feedback_id` | UUID | Yes | Unique feedback identifier |
| `session_id` | UUID | Yes | Associated challenge session |
| `evaluation_id` | UUID | Yes | Associated evaluation |
| `user_id` | UUID | Yes | Learner receiving feedback |
| `status` | String | Yes | Overall feedback status |
| `overall_feedback` | String | Yes | Main feedback text (AI-generated) |
| `areas_of_strength` | Array | Yes | What the learner did well |
| `areas_for_improvement` | Array | Yes | Topics to study more |
| `suggestions` | Array | Yes | Specific actionable improvements |
| `learning_resources` | Array | Yes | Curated learning links |
| `generated_at` | Timestamp | Yes | Generation timestamp |

## Rules

- `status` must be one of: PASSED, NEEDS_IMPROVEMENT, FAILED
- `overall_feedback` is AI-generated using LLM
- All text fields support markdown formatting
- Learning resources are curated by P6 based on evaluation gaps

## Usage

Produced by:
- P6 Feedback Service on `POST /feedback/generate`

Consumed by:
- P1 — To display feedback to learner
