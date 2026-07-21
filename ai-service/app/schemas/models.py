from pydantic import BaseModel
from typing import List, Optional

class MessageItem(BaseModel):
    message_id: str
    sender: str
    text: str
    timestamp: str
    is_quoted_reply_to: Optional[str] = None

class ClassifyRequest(BaseModel):
    window_id: str
    is_reply_chain: bool
    messages: List[MessageItem]

class ClassifyResponse(BaseModel):
    window_id: str
    is_important: bool
    confidence: float
    summary: str
    reasoning: str
