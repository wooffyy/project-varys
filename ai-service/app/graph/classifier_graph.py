from typing import TypedDict
from schemas.models import ClassifyRequest, ClassifyResponse
from langgraph.graph import StateGraph, END
from llm.groq_client import get_groq_client

class ClassifierState(TypedDict):
    request: ClassifyRequest
    response: ClassifyResponse

def classify_messages_node(state: ClassifierState) -> dict:
    req = state["request"]

    formatted_chats = []
    for m in req.messages:
        reply_meta = f"(Reply to: {m.is_quoted_reply_to})" if m.is_quoted_reply_to else ""
        formatted_chats.append(f"[{m.sender}] {reply_meta}: {m.text}")

    chat_history_str = "\n".join(formatted_chats)

    system_prompt = (
        "You are an AI Assistant specialized in filtering user's group chats.\n"
        "Your task is to determine whether the given chat history conversation (window) is IMPORTANT or NOT IMPORTANT.\n\n"
        "IMPORTANT Criteria:\n"
        "- Contains official announcements, lecture schedules, class changes, or lecturer information.\n"
        "- Contains assignments, deadlines, exams, or critical course materials.\n"
        "- Contains important questions from students that require follow-up.\n\n"
        "NOT IMPORTANT Criteria:\n"
        "- Casual chitchat, jokes, pure stickers/emojis without any academic context.\n"
        "- Thank you notes, or repetitive normative attendance confirmations ('aman', 'oke', 'siap').\n\n"
        "Evaluate the provided Indonesian chat history objectively and fill the response schema accurately."
    )

    user_prompt = f"Chat to evaluate:\n{chat_history_str}"

    model = get_groq_client()
    structured_response = model.with_structured_output(ClassifyResponse)

    result = structured_response.invoke([
        { "role": "system", "content": system_prompt },
        { "role": "user", "content": user_prompt }
    ])

    result.window_id = req.window_id
    return {"response": result}

workflow = StateGraph(ClassifierState)
workflow.add_node("classifier", classify_messages_node)
workflow.set_entry_point("classifier")
workflow.add_edge("classifier", END)

classifier_graph = workflow.compile()

async def run_classifier_graph(payload: ClassifyRequest) -> ClassifyResponse:
    initial_state = {"request": payload}
    output = await classifier_graph.ainvoke(initial_state)
    return output["response"]