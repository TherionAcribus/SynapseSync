from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from synapsesync.api.router import api_router
from synapsesync.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="SynapseSync")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"] ,
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok"}

    @app.get("/__routes")
    async def list_routes() -> list[dict]:
        routes: list[dict] = []
        for r in app.routes:
            methods = sorted(getattr(r, "methods", []) or [])
            routes.append({"path": getattr(r, "path", None), "name": getattr(r, "name", None), "methods": methods})
        return routes

    return app


app = create_app()
