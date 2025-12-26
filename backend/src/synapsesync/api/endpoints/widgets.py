from typing import Any

from fastapi import APIRouter, HTTPException

from synapsesync.core.discovery import registry

router = APIRouter()


@router.get("/widgets")
async def list_widgets() -> list[dict[str, Any]]:
    modules = registry.load_modules()

    widgets: list[dict[str, Any]] = []
    for module in modules.values():
        for w in module.get_widgets():
            widgets.append({"module_id": module.id, **w.model_dump()})

    return widgets


@router.get("/widget-data/{module_id}/{widget_id}")
async def get_widget_data(module_id: str, widget_id: str) -> dict[str, Any]:
    try:
        module = registry.get_module(module_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail="Unknown module") from e

    data = await module.get_widget_data(widget_id=widget_id, params={})
    return data.model_dump()
