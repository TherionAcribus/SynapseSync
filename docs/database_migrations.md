# Base de données & migrations (SQLite + Alembic)

## Emplacement de la DB

Par défaut : `data/synapsesync.db` (dans la racine du monorepo)

Le backend crée automatiquement le dossier parent si nécessaire.

## Tables V1

### `events`

Table pivot (Global Timeline).

Colonnes clés :
- `id` (PK)
- `timestamp` (datetime tz)
- `module_id` (string)
- `event_type` (string)
- `summary_text` (text)
- `metadata_json` (JSON)

Indexes :
- index sur `timestamp`
- index sur `module_id`
- index composite `module_id,timestamp`

### `dashboards`

Persistance de dashboards.

Colonnes :
- `id` (PK string)
- `config_json` (JSON)
- `updated_at` (datetime tz)

## Alembic

### Fichiers

- `backend/alembic.ini`
- `backend/migrations/env.py`
- `backend/migrations/versions/0001_create_events.py`
- `backend/migrations/versions/0002_create_dashboards.py`

### Commandes utiles (depuis `backend/`)

- Appliquer toutes les migrations :

```bash
uv run alembic upgrade head
```

- Voir l’historique :

```bash
uv run alembic history
```

- Downgrade (à utiliser avec prudence) :

```bash
uv run alembic downgrade -1
```

## Problèmes fréquents

- **"no such table"** : migrations non appliquées → `uv run alembic upgrade head`
- **"unable to open database file"** : dossier `data/` manquant → vérifier la config + permissions.
