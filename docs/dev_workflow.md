# Workflow de dev

## Prérequis

- Node.js (pour le frontend)
- Python 3.10+
- `uv` (recommandé pour gérer les deps python)

## Backend

Depuis `backend/` :

- Installer deps (selon ton setup) :

```bash
uv sync
```

- Appliquer migrations :

```bash
uv run alembic upgrade head
```

- Lancer le serveur :

```bash
uv run uvicorn synapsesync.main:app --reload --port 8001
```

## Frontend

Depuis `frontend/` :

```bash
npm install
npm run dev
```

URL : `http://localhost:5173`

## Variables d’environnement

Backend :
- copier `backend/.env.example` -> `backend/.env` (optionnel)

Frontend :
- `frontend/.env` (optionnel)

## Conventions

- **API backend** : `/api/...`
- **Dashboard principal** : id `default`

## Commandes utiles

- Diagnostiquer les routes backend :
  - `GET /__routes`

- Vérifier la DB (via API) :
  - `GET /api/dashboards/default`
