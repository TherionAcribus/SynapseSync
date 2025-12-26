# **Structure des dossiers synapsesync**

Cette arborescence suit une logique de monorepo simplifié où le backend et le frontend cohabitent, tout en permettant aux modules d'être développés comme des packages Python indépendants.

synapsesync/  
├── backend/                \# Racine du backend (FastAPI)  
│   ├── pyproject.toml      \# Gestion des dépendances (Poetry/Pip) et Entry Points  
│   ├── alembic.ini         \# Configuration des migrations BDD  
│   ├── .env.example        \# Modèle pour les variables d'environnement locales  
│   │  
│   ├── src/  
│   │   └── synapsesync/  
│   │       ├── \_\_init\_\_.py  
│   │       ├── main.py     \# Point d'entrée FastAPI  
│   │       │  
│   │       ├── core/       \# Logique centrale (le "Moteur")  
│   │       │   ├── database.py    \# Session SQLAlchemy & Engine  
│   │       │   ├── models.py      \# Modèles BDD communs (Events, Dashboards)  
│   │       │   ├── schemas.py     \# Modèles Pydantic de base  
│   │       │   ├── discovery.py   \# Logique de chargement des plugins  
│   │       │   ├── scheduler.py   \# Config APScheduler & Queue  
│   │       │   └── config.py      \# Gestion des paramètres via Pydantic Settings  
│   │       │  
│   │       ├── api/        \# Routes de l'API (v1)  
│   │       │   ├── router.py      \# Routeur principal  
│   │       │   ├── endpoints/  
│   │       │   │   ├── widgets.py  
│   │       │   │   ├── modules.py  
│   │       │   │   ├── dashboards.py  
│   │       │   │   └── ai.py  
│   │       │  
│   │       └── modules/    \# Modules internes (built-in)  
│   │           ├── common/ \# Classes de base (BaseModule, WidgetDescriptor)  
│   │           │   ├── base.py  
│   │           │   └── interfaces.py  
│   │           │  
│   │           ├── github/ \# Exemple de module intégré  
│   │           │   ├── \_\_init\_\_.py  
│   │           │   ├── provider.py  \# Logique spécifique (API GitHub)  
│   │           │   ├── models.py    \# Tables spécifiques au module  
│   │           │   └── widgets.py   \# Définition des widgets GitHub  
│   │           │  
│   │           └── ai/     \# Module IA (Ollama, etc.)  
│   │               ├── \_\_init\_\_.py  
│   │               ├── engine.py  
│   │               └── prompts.py  
│   │  
│   └── migrations/         \# Dossier généré par Alembic (versions des scripts)  
│  
├── frontend/               \# Racine du frontend (React \+ TS)  
│   ├── package.json  
│   ├── tsconfig.json  
│   ├── tailwind.config.js  
│   ├── public/  
│   └── src/  
│       ├── main.tsx  
│       ├── App.tsx  
│       ├── api/            \# Appels API (Axios/Fetch) vers le backend  
│       ├── store/          \# État global (Zustand ou Context)  
│       │  
│       ├── components/     \# Composants UI réutilisables (Boutons, Modals)  
│       │   └── ui/  
│       │  
│       ├── features/       \# Logique métier par fonctionnalité  
│       │   ├── dashboard/  \# Layout, Grille, Drag & Drop  
│       │   ├── assistant/  \# Interface Chat IA  
│       │   └── settings/   \# Config des modules  
│       │  
│       └── widgets/        \# Le "Widget Registry"  
│           ├── registry.ts     \# Mapping visual\_type \-\> Composant  
│           ├── TimeseriesWidget.tsx  
│           ├── ListWidget.tsx  
│           ├── CounterWidget.tsx  
│           └── TimelineWidget.tsx  
│  
├── data/                   \# Dossier ignoré par Git (contient sqlite.db)  
├── scripts/                \# Scripts utilitaires (setup, dev, install)  
└── README.md

## **Points clés de cette structure**

1. **backend/src/synapsesync/core/discovery.py** : C'est ici que tu utiliseras importlib.metadata pour scanner les modules installés via les entry-points dans le pyproject.toml.  
2. **backend/src/synapsesync/modules/common/** : Contient le "Contrat" (Protocol) que tous les modules doivent respecter. Cela évite les dépendances circulaires.  
3. **frontend/src/widgets/** : Toute la standardisation visuelle se passe ici. Le registry.ts est l'aiguilleur qui choisit le composant selon ce que le backend renvoie.  
4. **data/** : C'est ton stockage local. En phase V1, ton fichier synapsesync.db y résidera.

Veux-tu que je détaille le contenu du pyproject.toml pour voir comment on déclare proprement les entry-points pour les modules ?