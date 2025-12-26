# Frontend (React + TypeScript)

## Stack

- Vite
- React
- TypeScript

## Config dev

- `frontend/vite.config.ts`
  - proxy `/api` vers `http://127.0.0.1:8001`

- `frontend/.env`
  - `VITE_API_BASE_URL` peut être utilisé pour bypass le proxy (fallback robuste)

## Structure

- `src/App.tsx`
  - navigation simple par hash (`#/dashboard`, `#/modules`)

- `src/pages/DashboardPage.tsx`
  - charge la config du dashboard `default`
  - liste les widgets disponibles
  - permet d’ajouter/retirer des widgets
  - rend les widgets sélectionnés
  - persiste layout & sélection

- `src/pages/ModulesPage.tsx`
  - liste les modules
  - affiche leurs widgets
  - bouton sync

## API client

- `src/api/client.ts`
  - `apiFetch()` : gestion JSON, erreurs, base URL

- `src/api/synapsesync.ts`
  - types partagés frontend
  - fonctions : `listWidgets`, `getWidgetData`, `listModules`, `syncModule`, `getDashboard`, `saveDashboard`

## Widget Registry

- `src/widgets/registry.tsx`
  - mappe `visual_type` -> composant

Exemple :
- `counter` -> `CounterWidget`
- `timeline` -> `TimelineWidget`

## Layout (grid)

Le Dashboard utilise `react-grid-layout`.

- le layout est persisté dans `config_json.layout`
- contraintes (V1) : minW/minH
- le dashboard est résilient aux anciens formats (migration auto si besoin)
