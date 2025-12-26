# API HTTP (contrats)

Base URL (dev) : `http://127.0.0.1:8001`

Tous les endpoints sont préfixés par `/api`.

## Health & debug

- `GET /health`
  - retourne `{ "status": "ok" }`

- `GET /__routes`
  - retourne la liste des routes exposées par FastAPI (debug 404)

## Widgets

### Lister les widgets

- `GET /api/widgets`

Réponse : liste de `WidgetDescriptor`.

Exemple (schéma) :

```json
[
  {
    "module_id": "github",
    "id": "recent_activity",
    "title": "Activité GitHub récente",
    "visual_type": "timeline"
  }
]
```

### Récupérer les données d’un widget

- `GET /api/widget-data/{module_id}/{widget_id}`

Réponse : `WidgetData`

Exemple :

```json
{
  "visual_type": "timeline",
  "data": [
    {"timestamp": "2025-12-26T08:00:00+00:00", "summary_text": "...", "event_type": "..."}
  ]
}
```

## Modules

### Lister les modules

- `GET /api/modules`

Réponse :

```json
[
  {
    "id": "github",
    "widgets": [
      {"id": "recent_activity", "title": "...", "visual_type": "timeline"}
    ]
  }
]
```

### Forcer une synchronisation

- `POST /api/modules/{module_id}/sync`

Réponse :

```json
{"status":"ok"}
```

Notes :
- si un module nécessite des credentials (ex: GitHub), `sync` peut être un no-op tant que la config n’est pas fournie.

## Dashboards

### Récupérer un dashboard

- `GET /api/dashboards/{dashboard_id}`

Réponse :

```json
{
  "id": "default",
  "config_json": {
    "widgets": [
      {"module_id": "github", "widget_id": "recent_activity"}
    ],
    "layout": [
      {"i": "github:recent_activity", "x": 0, "y": 0, "w": 6, "h": 4, "minW": 2, "minH": 1}
    ]
  },
  "updated_at": "2025-12-26T08:45:06.427455"
}
```

### Sauver un dashboard

- `POST /api/dashboards/{dashboard_id}`

Payload :

```json
{
  "config_json": {
    "widgets": [
      {"module_id": "github", "widget_id": "events_7d"}
    ],
    "layout": [
      {"i": "github:events_7d", "x": 0, "y": 0, "w": 6, "h": 2}
    ]
  }
}
```

Réponse :

```json
{"status":"ok"}
```

## Codes d’erreurs attendus

- `503` sur dashboards si la DB n’a pas été migrée (table manquante)
- `4xx/5xx` propagées si erreur module/widget
