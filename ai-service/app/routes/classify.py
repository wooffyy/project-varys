from fastapi import APIRouter, HTTPException
from schemas.models import ClassifyRequest, ClassifyResponse
from graph.classifier_graph import run_classifier_graph

router = APIRouter(prefix="/classify", tags=["Classification"])

@router.post("", response_model=ClassifyResponse)
async def classify_window(payload: ClassifyRequest):
    try:
        response = await run_classifier_graph(payload) 
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    