from __future__ import annotations

from typing import Any, Protocol

from pydantic import BaseModel, Field


class WidgetDescriptor(BaseModel):
    id: str
    title: str
    visual_type: str
    description: str | None = None
    config_schema: dict[str, Any] = Field(default_factory=dict)


class WidgetData(BaseModel):
    visual_type: str
    data: Any


class BaseModule(Protocol):
    id: str

    async def sync(self) -> None:
        ...

    def get_widgets(self) -> list[WidgetDescriptor]:
        ...

    async def get_widget_data(self, widget_id: str, params: dict[str, Any]) -> WidgetData:
        ...
