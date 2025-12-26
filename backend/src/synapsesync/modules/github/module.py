from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import func, select

from synapsesync.core.config import get_settings
from synapsesync.core.database import SessionLocal
from synapsesync.core.models import Event
from synapsesync.modules.common.interfaces import WidgetData, WidgetDescriptor


class GitHubModule:
    id = "github"

    async def sync(self) -> None:
        settings = get_settings()
        if not settings.github_username:
            return

        url = f"https://api.github.com/users/{settings.github_username}/events"
        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=headers, params={"per_page": 30})
            resp.raise_for_status()
            events: list[dict[str, Any]] = resp.json()

        session = SessionLocal()
        try:
            for ev in events:
                created_at = ev.get("created_at")
                if not created_at:
                    continue

                ts = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                repo_name = (ev.get("repo") or {}).get("name")
                ev_type = ev.get("type") or "event"

                summary = f"{settings.github_username}: {ev_type}"
                if repo_name:
                    summary = f"{summary} ({repo_name})"

                session.add(
                    Event(
                        timestamp=ts,
                        module_id=self.id,
                        event_type=ev_type,
                        summary_text=summary,
                        metadata_json=ev,
                    )
                )

            session.commit()
        finally:
            session.close()

    def get_widgets(self) -> list[WidgetDescriptor]:
        return [
            WidgetDescriptor(
                id="recent_activity",
                title="Activité GitHub récente",
                visual_type="timeline",
            ),
            WidgetDescriptor(
                id="events_7d",
                title="Événements GitHub (7 jours)",
                visual_type="counter",
            ),
        ]

    async def get_widget_data(self, widget_id: str, params: dict[str, Any]) -> WidgetData:
        session = SessionLocal()
        try:
            if widget_id == "recent_activity":
                limit = int(params.get("limit", 30))
                rows = session.execute(
                    select(Event)
                    .where(Event.module_id == self.id)
                    .order_by(Event.timestamp.desc())
                    .limit(limit)
                ).scalars()

                data = [
                    {
                        "timestamp": e.timestamp.isoformat(),
                        "summary_text": e.summary_text,
                        "event_type": e.event_type,
                    }
                    for e in rows
                ]

                return WidgetData(visual_type="timeline", data=data)

            if widget_id == "events_7d":
                now = datetime.now(tz=timezone.utc)
                since = now - timedelta(days=7)

                count = session.execute(
                    select(func.count())
                    .select_from(Event)
                    .where(Event.module_id == self.id)
                    .where(Event.timestamp >= since)
                ).scalar_one()

                return WidgetData(visual_type="counter", data={"value": int(count)})

            return WidgetData(visual_type="unknown", data=None)
        finally:
            session.close()
