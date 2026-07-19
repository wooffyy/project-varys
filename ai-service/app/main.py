from fastapi import FastAPI
import uvicorn
from routes import classify

app = FastAPI(title="Project Varys", version="0.1.0")

app.include_router(classify.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)