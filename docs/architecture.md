# Architecture & concepts

## Vue d’ensemble

SynapseSync est une application **local-first**, pensée comme un noyau + des modules.

- **Backend** (FastAPI) :
  - découverte des modules
  - synchronisation
  - exposition d’API standardisées (widgets, modules, dashboards)
  - persistance SQLite
- **Frontend** (React + TypeScript) :
  - navigation simple (Dashboard / Modules)
  - rendu des widgets via un registre
  - configuration et layout (grille draggable/resizable)

## Schéma logique

```text
+-------------------------+          +--------------------------+
|        Frontend         |          |         Backend           |
|  React + TS (Vite)      |  HTTP     |  FastAPI                 |
|-------------------------| <-------> |--------------------------|
| - pages Dashboard       |          | - /api/widgets            |
| - pages Modules         |          | - /api/widget-data/...    |
| - Widget Registry       |          | - /api/modules (+ sync)   |
| - Layout (grid)         |          | - /api/dashboards/{id}    |
+-------------------------+          | - ModuleRegistry          |
                                     | - SQLAlchemy + Alembic    |
                                     +-------------+------------+
                                                   |
                                                   v
                                     +--------------------------+
                                     |        SQLite DB          |
                                     | - events                  |
                                     | - dashboards              |
                                     +--------------------------+
```

## Concepts centraux

### 1) Global Timeline (`events`)

Objectif : une table pivot qui agrège l’activité de tous les modules.

- `module_id` : identifiant stable du module (ex: `github`)
- `event_type` : type d’événement (ex: `PushEvent`)
- `summary_text` : résumé lisible
- `metadata_json` : payload module-specific

### 2) Modules (plugins)

Chaque module :
- expose un `id` stable
- sait faire un `sync()`
- déclare des widgets (`get_widgets()`)
- fournit des données de widget (`get_widget_data()`)

Les modules sont découverts via les **entry-points Python** (voir `backend/pyproject.toml`).

### 3) Widgets

Le backend expose :
- un catalogue de widgets (`WidgetDescriptor`)
- des données standardisées (`WidgetData`) consommables par le frontend

Le frontend ne connaît pas les modules : il sait juste rendre un `visual_type`.

### 4) Dashboards

Le dashboard `default` est persisté en base dans `dashboards.config_json`.

Dans V1, `config_json` contient :
- `widgets`: liste de `{ module_id, widget_id }`
- `layout`: layout de grille persisté (drag/resize)
