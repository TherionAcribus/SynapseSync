from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from synapsesync.core.database import SessionLocal
from synapsesync.core.models import Dashboard

router = APIRouter()


class DashboardPayload(BaseModel):
    config_json: dict[str, Any]


@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str) -> dict[str, Any]:
    session = SessionLocal()
    try:
        try:
            row = session.execute(select(Dashboard).where(Dashboard.id == dashboard_id)).scalar_one_or_none()
        except OperationalError as e:
            if "no such table: dashboards" in str(e).lower():
                raise HTTPException(
                    status_code=503,
                    detail="Database is missing dashboards table. Run: alembic upgrade head",
                ) from e
            raise
        if row is None:
            return {"id": dashboard_id, "config_json": {"widgets": []}}
        return {"id": row.id, "config_json": row.config_json, "updated_at": row.updated_at.isoformat()}
    finally:
        session.close()


@router.post("/{dashboard_id}")
async def upsert_dashboard(dashboard_id: str, payload: DashboardPayload) -> dict[str, Any]:
    session = SessionLocal()
    try:
        try:
            row = session.execute(select(Dashboard).where(Dashboard.id == dashboard_id)).scalar_one_or_none()
        except OperationalError as e:
            if "no such table: dashboards" in str(e).lower():
                raise HTTPException(
                    status_code=503,
                    detail="Database is missing dashboards table. Run: alembic upgrade head",
                ) from e
            raise
        if row is None:
            row = Dashboard(id=dashboard_id, config_json=payload.config_json)
            session.add(row)
        else:
            row.config_json = payload.config_json
            row.updated_at = datetime.now(tz=timezone.utc)

        session.commit()
        return {"status": "ok"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e)) from e
    finally:
        session.close()
