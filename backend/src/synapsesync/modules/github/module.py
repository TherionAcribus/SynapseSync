from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.exc import OperationalError

from synapsesync.core.config import get_settings
from synapsesync.core.database import SessionLocal
from synapsesync.core.models import Event, ModuleConfig
from synapsesync.modules.common.interfaces import WidgetData, WidgetDescriptor


class GitHubModule:
    id = "github"

    def _get_config(self) -> dict[str, Any]:
        session = SessionLocal()
        try:
            try:
                row = session.execute(select(ModuleConfig).where(ModuleConfig.module_id == self.id)).scalar_one_or_none()
            except OperationalError:
                row = None

            if row is not None:
                return row.config_json or {}
        finally:
            session.close()

        return {}


    def _get_credentials(self) -> tuple[str | None, str | None]:
        cfg = self._get_config()
        username = (cfg.get("username") or "").strip() or None
        token = (cfg.get("token") or "").strip() or None
        if username:
            return username, token

        settings = get_settings()
        return settings.github_username, settings.github_token

    async def sync(self) -> None:
        cfg = self._get_config()
        provider = (cfg.get("provider") or "api").strip().lower()

        if provider == "hpi":
            try:
                from my.github.all import get_events  # type: ignore
            except Exception as e:
                # More specific error message for missing dependencies
                if "No module named 'ghexport'" in str(e):
                    raise RuntimeError("HPI GitHub module requires 'ghexport'. Install it or switch to provider=api.") from e
                elif "my.config" in str(e):
                    raise RuntimeError("HPI not configured. Run 'hpi config create' or switch to provider=api.") from e
                else:
                    raise RuntimeError(f"HPI import failed: {e}. Install HPI or switch to provider=api.") from e

            session = SessionLocal()
            try:
                inserted = 0
                first_error: Exception | None = None
                try:
                    for item in get_events():
                        if isinstance(item, Exception):
                            if first_error is None:
                                first_error = item
                            continue

                        session.add(
                            Event(
                                timestamp=item.dt,
                                module_id=self.id,
                                event_type="hpi",
                                summary_text=item.summary,
                                metadata_json={
                                    "provider": "hpi",
                                    "eid": item.eid,
                                    "link": item.link,
                                    "body": item.body,
                                },
                            )
                        )
                        inserted += 1
                except ValueError as e:
                    # HPI n'a pas de données (max() arg is an empty sequence)
                    if "max() arg is an empty sequence" in str(e):
                        # Normal, HPI est vide, on continue avec 0 événement
                        pass
                    else:
                        raise

                if inserted == 0 and first_error is not None:
                    raise RuntimeError(str(first_error))

                session.commit()
            finally:
                session.close()

            return

        username, token = self._get_credentials()
        if not username:
            return

        # NOTE: GitHub events endpoint is /users/{username}/events.
        # If authenticated as that user, it can include private events.
        url = f"https://api.github.com/users/{username}/events"
        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

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

                summary = f"{username}: {ev_type}"
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
            WidgetDescriptor(
                id="commit_streak",
                title="Commit Streak",
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

            if widget_id == "commit_streak":
                # Récupérer tous les PushEvent des 365 derniers jours
                now = datetime.now(tz=timezone.utc)
                since = now - timedelta(days=365)
                
                rows = session.execute(
                    select(Event)
                    .where(Event.module_id == self.id)
                    .where(Event.event_type == "PushEvent")
                    .where(Event.timestamp >= since)
                    .order_by(Event.timestamp.desc())
                ).scalars().all()
                
                # Calculer le streak actuel
                current_streak = self._calculate_commit_streak(rows, now)
                
                return WidgetData(
                    visual_type="counter", 
                    data={
                        "value": current_streak,
                        "unit": "jours"
                    }
                )

            return WidgetData(visual_type="unknown", data=None)
        finally:
            session.close()

    def _calculate_commit_streak(self, events: list[Event], now: datetime) -> int:
        """Calcule le nombre de jours consécutifs avec des commits."""
        if not events:
            return 0
            
        # Extraire les dates uniques des events
        commit_dates = set()
        for event in events:
            # Convertir en date locale (sans heure)
            local_date = event.timestamp.astimezone().date()
            commit_dates.add(local_date)
        
        if not commit_dates:
            return 0
            
        # Trier les dates
        sorted_dates = sorted(commit_dates, reverse=True)
        
        # Vérifier si aujourd'hui ou hier a des commits
        today = now.astimezone().date()
        yesterday = today - timedelta(days=1)
        
        current_streak = 0
        
        # Si aujourd'hui a des commits, commencer avec aujourd'hui
        if today in commit_dates:
            current_date = today
        # Sinon, si hier a des commits, commencer avec hier
        elif yesterday in commit_dates:
            current_date = yesterday
        else:
            return 0
            
        # Compter les jours consécutifs
        while current_date in commit_dates:
            current_streak += 1
            current_date -= timedelta(days=1)
            
        return current_streak
