# LLM Module

**Owner:** P2 (Backend Platform Lead)

**Purpose:** Provide a centralized, provider-agnostic LangChain chat model factory.

All LLM access must go through this module. Feature teams must not instantiate chat models directly.

---

## Public Contract

```python
from app.llm.factory import get_llm

llm = get_llm()
response = llm.invoke(messages)
await response = llm.ainvoke(messages)
```

---

## Configuration

Required environment variables (in `.env`):

```env
LLM_PROVIDER=openai        # Provider name: openai, groq, openrouter, together, novita, etc.
LLM_MODEL=gpt-4o           # Model name for the provider
LLM_API_KEY=sk-...         # API key for the provider
LLM_BASE_URL=              # Optional; base URL for non-OpenAI providers (e.g., Groq)
```

**All three required variables must be set.** Missing values raise `ValueError` when `get_llm()` is called.

---

## Supported Providers

Works with **any OpenAI-compatible endpoint**:

- OpenAI (gpt-4o, gpt-4-turbo, gpt-3.5-turbo, etc.)
- Groq (mixtral-8x7b-32768, etc.) — set `LLM_BASE_URL=https://api.groq.com/openai/v1`
- OpenRouter (various models) — set `LLM_BASE_URL=https://openrouter.io/api/v1`
- Together AI — set `LLM_BASE_URL=https://api.together.ai/v1`
- Novita (text-davinci-003, etc.) — set `LLM_BASE_URL=https://api.novita.ai/v3/openai`

**No provider enums. No model restrictions.** Specify any model name for any provider.

---

## Module Structure

```
llm/
├── __init__.py       — Module docstring
├── factory.py        — get_llm() implementation
└── README.md         — This file
```

---

## Failure Modes

The factory fails fast:

- `LLM_PROVIDER` missing → `ValueError: Environment variable LLM_PROVIDER is required but not set`
- `LLM_MODEL` missing → `ValueError: Environment variable LLM_MODEL is required but not set`
- `LLM_API_KEY` missing → `ValueError: Environment variable LLM_API_KEY is required but not set`

No silent fallbacks. No defaults.

---

## Ownership

- **Owns:** Configuration loading, client instantiation
- **Does NOT own:** Prompts, chains, evaluators, scenario generation, feedback generation, evaluation logic
- **Boundary:** This is a factory only. Feature teams implement their own workflows using the LLM instance.

---

## Consumed By

- P3 (Scenario Generation)
- P5 (Evaluation)
- P6 (Feedback Generation)
