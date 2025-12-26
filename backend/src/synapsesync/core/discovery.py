from __future__ import annotations

from importlib import metadata

from synapsesync.modules.common.interfaces import BaseModule


class ModuleRegistry:
    def __init__(self) -> None:
        self._modules: dict[str, BaseModule] | None = None

    def load_modules(self) -> dict[str, BaseModule]:
        if self._modules is not None:
            return self._modules

        modules: dict[str, BaseModule] = {}
        entry_points = metadata.entry_points().select(group="synapsesync.modules")

        for ep in entry_points:
            module_cls = ep.load()
            module: BaseModule = module_cls()
            modules[module.id] = module

        self._modules = modules
        return modules

    def get_module(self, module_id: str) -> BaseModule:
        modules = self.load_modules()
        return modules[module_id]


registry = ModuleRegistry()
