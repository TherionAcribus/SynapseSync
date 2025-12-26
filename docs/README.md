# Documentation technique — SynapseSync

Ce dossier contient la documentation technique du projet (backend, frontend, DB, API, modules).

## Sommaire

- [Architecture & concepts](./architecture.md)
- [Backend (FastAPI)](./backend.md)
- [Base de données & migrations (SQLite + SQLAlchemy + Alembic)](./database_migrations.md)
- [API HTTP (contrats)](./api.md)
- [Modules & Widgets (plugin system)](./modules_widgets.md)
- [Frontend (React + TS)](./frontend.md)
- [Workflow de dev](./dev_workflow.md)
- [Troubleshooting](./troubleshooting.md)

## TL;DR (points clés)

- **Monorepo** : `backend/` (FastAPI) + `frontend/` (Vite/React).
- **Local-first** : SQLite par défaut (`data/synapsesync.db`).
- **Global Timeline** : table `events` (toutes les activités des modules).
- **Dashboards** : table `dashboards`, persistance de `config_json`.
- **Widgets** : le backend expose des `WidgetDescriptor` + `WidgetData` ; le frontend rend via un `Widget Registry`.
- **Modules** : chargés via entry-points Python (`synapsesync.modules`).

## Convention de version

La doc décrit l’état **V1** (MVP). Les évolutions prévues (scheduler, IA, etc.) seront ajoutées au fil de l’eau.
