# Modules & Widgets (plugin system)

## Objectif

Permettre d’ajouter des sources de données sans modifier le noyau.

Un module :
- synchronise des données
- pousse des événements dans la Global Timeline (`events`)
- déclare des widgets
- fournit les données des widgets

## Discovery via entry-points

Les modules sont découverts via les entry-points Python.

- Groupe : `synapsesync.modules`
- Déclaration : `backend/pyproject.toml`

Exemple (principe) :

```toml
[project.entry-points."synapsesync.modules"]
github = "synapsesync.modules.github.module:GitHubModule"
```

## Contrats (interfaces)

Fichier : `backend/src/synapsesync/modules/common/interfaces.py`

- `WidgetDescriptor`
  - `id`: identifiant stable du widget (unique dans le module)
  - `title`
  - `visual_type`: type visuel standardisé (ex: `counter`, `timeline`)

- `WidgetData`
  - `visual_type`
  - `data`: payload JSON

- `BaseModule` (Protocol)
  - `id: str`
  - `async sync() -> None`
  - `get_widgets() -> list[WidgetDescriptor]`
  - `async get_widget_data(widget_id: str, params: dict) -> WidgetData`

## Règles de conception

- **IDs stables** : `module_id` et `widget_id` ne doivent pas changer.
- **Données sérialisables** : `metadata_json` et `WidgetData.data` doivent rester JSON-friendly.
- **Idempotence** (V1 simplifiée) : la sync peut réinsérer ; on pourra dédupliquer ensuite.

## Exemple : module GitHub

Fichier : `backend/src/synapsesync/modules/github/module.py`

Widgets exposés :
- `recent_activity` (timeline)
- `events_7d` (counter)

Données :
- `recent_activity` lit les derniers `Event` du module.
- `events_7d` fait un `COUNT(*)` sur les 7 derniers jours.

## Widgets côté frontend

Le frontend ne connaît pas les modules.

- un widget = `(module_id, widget_id)`
- le backend renvoie `visual_type`
- le frontend mappe `visual_type` -> composant via un registry

Fichier : `frontend/src/widgets/registry.tsx`
