from langchain_groq import ChatGroq
from core.config import settings

def get_groq_client() -> ChatGroq:
    return ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile",
        groq_api_key=settings.GROQ_API_KEY
    )