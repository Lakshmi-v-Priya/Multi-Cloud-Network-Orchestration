from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.api.intent import router as intent_router
from app.api.comparison import router as comparison_router
from app.api.cost_analysis import router as cost_analysis_router
from app.api.optimization import router as optimization_router
from app.api.orchestration import router as orchestration_router
from app.api.validation import router as validation_router
from app.api.deployment import router as deployment_router
from app.api.terraform_validation import router as terraform_validation_router


class Settings(BaseSettings):
    APP_NAME: str = "MultiCloud Orchestrator"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "LLM-Driven Cost-Aware Intent-Based "
        "Multi-Cloud Network Orchestration API"
    ),
    debug=settings.DEBUG
)

app.include_router(intent_router, prefix="/api/v1")
app.include_router(comparison_router, prefix="/api/v1")
app.include_router(cost_analysis_router, prefix="/api/v1")
app.include_router(optimization_router, prefix="/api/v1")
app.include_router(orchestration_router, prefix="/api/v1")
app.include_router(validation_router, prefix="/api/v1")
app.include_router(deployment_router, prefix="/api/v1")
app.include_router(terraform_validation_router, prefix="/api/v1")

# Allow the React frontend to communicate with FastAPI.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "MultiCloud Orchestrator API is running",
        "version": settings.APP_VERSION,
        "status": "success"
    }


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION
    }
