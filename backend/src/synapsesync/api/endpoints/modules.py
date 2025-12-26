from fastapi import APIRouter, HTTPException

from synapsesync.core.discovery import registry

router = APIRouter()


@router.get("")
async def list_modules() -> list[dict]:
    modules = registry.load_modules()
    return [
        {
            "id": m.id,
            "widgets": [w.model_dump() for w in m.get_widgets()],
        }
        for m in modules.values()
    ]


@router.post("/{module_id}/sync")
async def sync_module(module_id: str) -> dict:
    try:
        module = registry.get_module(module_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail="Unknown module") from e

    await module.sync()
    return {"status": "ok"}
