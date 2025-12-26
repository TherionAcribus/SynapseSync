# Backend (FastAPI)

## Stack

- Python 3.10+
- FastAPI
- Pydantic Settings
- SQLAlchemy
- Alembic

## Point d’entrée

- `backend/src/synapsesync/main.py`
  - création de l’app FastAPI
  - CORS
  - inclusion du routeur API `/api`
  - endpoint debug `/_ _routes` (utile pour diagnostiquer des 404)

## Configuration

- `backend/src/synapsesync/core/config.py`
  - variables d’environnement prefixées par `SYNAPSESYNC_`
  - `.env` optionnel
  - création automatique du dossier parent de la DB SQLite (évite `unable to open database file`)

Variables principales :

- `SYNAPSESYNC_DATABASE_URL`
  - défaut : `sqlite:///../data/synapsesync.db`
- `SYNAPSESYNC_CORS_ORIGINS`
  - défaut : `http://localhost:5173`, `http://127.0.0.1:5173`
- `SYNAPSESYNC_GITHUB_USERNAME`
- `SYNAPSESYNC_GITHUB_TOKEN`

## Base de données (SQLAlchemy)

- `backend/src/synapsesync/core/database.py`
  - `get_engine()`
  - `SessionLocal`
  - `get_session()` (generator) pour les deps FastAPI

## Modèles

- `backend/src/synapsesync/core/models.py`
  - `Event`
  - `Dashboard`

## Routeur API

- `backend/src/synapsesync/api/router.py`
  - `/api/modules`
  - `/api/widgets`
  - `/api/widget-data/{module_id}/{widget_id}`
  - `/api/dashboards/{id}`

## Endpoints importants

- `backend/src/synapsesync/api/endpoints/modules.py`
  - `GET /api/modules`
  - `POST /api/modules/{module_id}/sync`

- `backend/src/synapsesync/api/endpoints/widgets.py`
  - `GET /api/widgets`
  - `GET /api/widget-data/{module_id}/{widget_id}`

- `backend/src/synapsesync/api/endpoints/dashboards.py`
  - `GET /api/dashboards/{dashboard_id}`
  - `POST /api/dashboards/{dashboard_id}`

Notes :
- en cas de DB non migrée, les endpoints dashboards renvoient `503` avec un message explicite.

## ModuleRegistry (discovery)

- `backend/src/synapsesync/core/discovery.py`

Le registry charge les modules via `importlib.metadata.entry_points` sur le groupe :
- `synapsesync.modules`

Cela permet :
- d’avoir des modules internes
- mais aussi d’installer des modules externes via pip/uv (architecture plugin).
