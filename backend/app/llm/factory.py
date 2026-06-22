"""LLM factory — OpenAI-compatible chat model instantiation.

Creates LangChain ChatOpenAI instances configured via environment variables.
Supports OpenAI, Groq, OpenRouter, Together, Novita, and other OpenAI-compatible
endpoints via base_url configuration.
"""
import os
from langchain_openai import ChatOpenAI


def get_llm():
    """Get a configured LangChain ChatOpenAI instance.

    Reads configuration from environment variables:
    - LLM_MODEL: Model name (e.g., 'gpt-4o', 'mixtral-8x7b-32768')
    - LLM_API_KEY: API key for the provider
    - LLM_BASE_URL: Base URL (optional; for non-OpenAI providers)

    Returns:
        ChatOpenAI: Initialized OpenAI-compatible chat model.

    Raises:
        ValueError: If LLM_MODEL or LLM_API_KEY is not set.

    Usage:
        from app.llm.factory import get_llm

        llm = get_llm()
        response = llm.invoke(messages)
        response = await llm.ainvoke(messages)

    Configuration examples:
        OpenAI:
            LLM_MODEL=gpt-4o
            LLM_API_KEY=sk-...
            LLM_BASE_URL=  (omit for default)

        Groq:
            LLM_MODEL=mixtral-8x7b-32768
            LLM_API_KEY=gsk-...
            LLM_BASE_URL=https://api.groq.com/openai/v1

        OpenRouter:
            LLM_MODEL=openai/gpt-4
            LLM_API_KEY=sk-or-...
            LLM_BASE_URL=https://openrouter.io/api/v1
    """
    model = os.getenv("LLM_MODEL")
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL")

    # Validate required configuration
    if not model:
        raise ValueError("Environment variable LLM_MODEL is required but not set")
    if not api_key:
        raise ValueError("Environment variable LLM_API_KEY is required but not set")

    # Create OpenAI-compatible client
    kwargs = {
        "model": model,
        "api_key": api_key,
        "temperature": 0.7,
    }

    if base_url:
        kwargs["base_url"] = base_url

    return ChatOpenAI(**kwargs)
