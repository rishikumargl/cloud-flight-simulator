"""LLM module — provider-agnostic LangChain chat model factory.

Public contract:
  from app.llm.factory import get_llm
  llm = get_llm()
  response = llm.invoke(messages)

Feature teams (P3, P5, P6) must not instantiate chat models directly.
"""
