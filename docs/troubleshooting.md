# Troubleshooting

## 1) 404 sur `/api/...`

- Vérifie que le backend tourne
- Vérifie le port (`8001`)
- Vérifie `frontend/vite.config.ts` (proxy `/api` -> backend)
- Vérifie `GET http://127.0.0.1:8001/__routes`

## 2) CORS errors

Normalement évité via proxy Vite.

Si appel direct (VITE_API_BASE_URL) :
- ajouter l’origine dans `SYNAPSESYNC_CORS_ORIGINS`
  - ex: `http://localhost:5173`, `http://127.0.0.1:5173`

## 3) "unable to open database file" (SQLite)

Cause : dossier parent du `.db` absent.

Fix :
- vérifier `SYNAPSESYNC_DATABASE_URL`
- créer `data/`
- le backend crée normalement le parent automatiquement.

## 4) "no such table" (migrations)

Cause : Alembic non appliqué.

Fix :

```bash
uv run alembic upgrade head
```

## 5) Dashboards: layout instable / overlap

Si `config_json.layout` contient des valeurs invalides (null/NaN), la grille peut diverger.

Fix :
- recharger la page Dashboard : elle corrige et persiste un layout sain.
- sinon, supprimer/réinitialiser le dashboard via `POST /api/dashboards/default` avec un layout propre.

## 6) GitHub sync ne ramène rien

Cause fréquente :
- `SYNAPSESYNC_GITHUB_USERNAME` non défini

Optionnel :
- `SYNAPSESYNC_GITHUB_TOKEN` (évite limites rate limit)
