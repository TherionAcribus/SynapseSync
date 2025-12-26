from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from synapsesync.core.database import SessionLocal
from synapsesync.core.discovery import registry
from synapsesync.core.models import ModuleConfig

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

    try:
        await module.sync()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {"status": "ok"}


class ModuleConfigPayload(BaseModel):
    config_json: dict[str, Any]


def _ensure_module_exists(module_id: str) -> None:
    try:
        registry.get_module(module_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail="Unknown module") from e


def _get_stored_config(module_id: str) -> dict[str, Any] | None:
    session = SessionLocal()
    try:
        try:
            row = session.execute(select(ModuleConfig).where(ModuleConfig.module_id == module_id)).scalar_one_or_none()
        except OperationalError as e:
            if "no such table: module_configs" in str(e).lower():
                raise HTTPException(
                    status_code=503,
                    detail="Database is missing module_configs table. Run: alembic upgrade head",
                ) from e
            raise
        return None if row is None else row.config_json
    finally:
        session.close()


def _validate_module_config(module_id: str, config_json: dict[str, Any]) -> None:
    if module_id == "github":
        provider = (config_json.get("provider") or "api").strip().lower()
        if provider not in {"api", "hpi"}:
            raise HTTPException(status_code=400, detail="github.provider must be 'api' or 'hpi'")

        if provider == "hpi":
            return

        username = (config_json.get("username") or "").strip()
        token = (config_json.get("token") or "").strip()
        if not username:
            raise HTTPException(status_code=400, detail="github.username is required")
        if token and len(token) < 10:
            raise HTTPException(status_code=400, detail="github.token looks too short")


@router.get("/{module_id}/config")
async def get_module_config(module_id: str) -> dict[str, Any]:
    _ensure_module_exists(module_id)
    config_json = _get_stored_config(module_id)
    if config_json is None:
        return {"module_id": module_id, "config_json": {}}
    return {"module_id": module_id, "config_json": config_json}


@router.post("/{module_id}/config")
async def upsert_module_config(module_id: str, payload: ModuleConfigPayload) -> dict[str, Any]:
    _ensure_module_exists(module_id)
    _validate_module_config(module_id, payload.config_json)

    session = SessionLocal()
    try:
        try:
            row = session.execute(select(ModuleConfig).where(ModuleConfig.module_id == module_id)).scalar_one_or_none()
        except OperationalError as e:
            if "no such table: module_configs" in str(e).lower():
                raise HTTPException(
                    status_code=503,
                    detail="Database is missing module_configs table. Run: alembic upgrade head",
                ) from e
            raise

        if row is None:
            row = ModuleConfig(module_id=module_id, config_json=payload.config_json)
            session.add(row)
        else:
            row.config_json = payload.config_json
            row.updated_at = datetime.now(tz=timezone.utc)

        session.commit()
        return {"status": "ok"}
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    finally:
        session.close()


@router.post("/{module_id}/test")
async def test_module_config(module_id: str, payload: ModuleConfigPayload | None = None) -> dict[str, Any]:
    _ensure_module_exists(module_id)
    config_json = payload.config_json if payload is not None else (_get_stored_config(module_id) or {})
    _validate_module_config(module_id, config_json)

    if module_id == "github":
        provider = (config_json.get("provider") or "api").strip().lower()
        if provider == "hpi":
            try:
                from my.github.all import get_events  # type: ignore
            except Exception as e:
                # More specific error message for missing dependencies
                if "No module named 'ghexport'" in str(e):
                    raise HTTPException(status_code=400, detail="HPI GitHub module requires 'ghexport'. Install it or switch to provider=api.") from e
                elif "my.config" in str(e):
                    raise HTTPException(status_code=400, detail="HPI not configured. Run 'hpi config create' or switch to provider=api.") from e
                else:
                    raise HTTPException(status_code=400, detail=f"HPI import failed: {e}. Install HPI or switch to provider=api.") from e

            try:
                it = iter(get_events())
                first = next(it, None)
                if first is None:
                    return {"status": "ok"}
                if isinstance(first, Exception):
                    raise HTTPException(status_code=400, detail=str(first))
                return {"status": "ok"}
            except ValueError as e:
                # HPI n'a pas de données (max() arg is an empty sequence)
                if "max() arg is an empty sequence" in str(e):
                    return {"status": "ok"}
                raise HTTPException(status_code=400, detail=f"HPI error: {e}") from e

        username = (config_json.get("username") or "").strip()
        token = (config_json.get("token") or "").strip()

        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            url = "https://api.github.com/user"
        else:
            url = f"https://api.github.com/users/{username}"

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code >= 400:
                raise HTTPException(status_code=400, detail=resp.text)
            return {"status": "ok"}

    raise HTTPException(status_code=400, detail="No test implemented for this module")
