from fastapi import APIRouter, HTTPException
from schemas.models import ClassifyRequest, ClassifyResponse

router = APIRouter(prefix="/classify", tags=["Classification"])

@router.post("", response_model=ClassifyResponse)
async def classify_window(payload: ClassifyRequest):
    try:
        # Dummy 
        return ClassifyResponse(
            window_id=payload.window_id,
            is_important=True,
            confidence=0.5,
            summary="Dummy",
            reasoning="Dummy"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    