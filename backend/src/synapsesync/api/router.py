from fastapi import APIRouter

from synapsesync.api.endpoints import dashboards, modules, widgets

api_router = APIRouter()

api_router.include_router(modules.router, prefix="/modules", tags=["modules"])
api_router.include_router(widgets.router, tags=["widgets"])
api_router.include_router(dashboards.router, prefix="/dashboards", tags=["dashboards"])
