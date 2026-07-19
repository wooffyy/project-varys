from app.schemas.models import ClassifyRequest, ClassifyResponse

async def run_classifier_graph(payload: ClassifyRequest) -> ClassifyResponse:
    return ClassifyResponse(
        window_id=payload.window_id,
        is_important=True,
        confidence=0.5,
        summary="Dummy",
        reasoning="Dummy"
    )