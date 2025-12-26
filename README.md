# **SynapseSync (nom de travail)**

Une application **locale**, **open source** et **ultra modulaire** pour explorer ta vie numérique (GitHub, médias, mangas, sport, lectures…) avec des dashboards personnalisables et un “guide IA”.

## **🌱 Philosophie du projet**

SynapseSync est un **“tableau de bord de vie” local-first**, conçu pour la souveraineté des données :

* **Stockage local intégral** : SQLite par défaut, aucune donnée ne quitte la machine sans consentement explicite.  
* **Extensibilité totale** : Architecture par plugins (modules Python indépendants).  
* **Abstraction de la logique métier** : Le frontend est agnostique vis-à-vis des sources ; il ne traite que des formats de widgets standardisés.  
* **IA comme guide** : Une IA (locale via Ollama ou cloud) analyse ta chronologie de vie pour suggérer des améliorations et des ressources.  
* **HPI-friendly** : Le projet s’inspire de HPI mais reste indépendant. HPI n’est qu’un adaptateur de données possible parmi d’autres.

## **🧱 Architecture technique (4 couches)**

### **1\. Sources & données (Data Layer)**

* **Providers** :  
  * APIs directes (GitHub, Strava, Trakt, Komga, Jellyfin, etc.)  
  * Exporters / HPI (par exemple ghexport, goodrexport…) lorsque c’est pertinent.  
* **Base de données** :  
  * SQLite par défaut, orchestré par **SQLAlchemy \+ Alembic**.  
  * Possibilité d’évoluer vers Postgres si besoin.

#### **Global Timeline (table events)**

Une table centrale qui **centralise l’activité de tous les modules** pour permettre une vue transverse de la vie numérique :

* **Rôle** : point d’entrée pour les vues “ma journée / ma semaine” et pour l’IA.  
* **Structure indicative** :  
  events  
  \------  
  id             (PK)  
  timestamp      (datetime)  
  module\_id      (string, ex: "github", "manga")  
  event\_type     (string, ex: "commit", "chapter\_read", "workout")  
  summary\_text   (string court, lisible humainement)  
  metadata\_json  (JSON avec les détails spécifiques au module)

Chaque module, lors de sa synchronisation, pousse des événements dans cette Global Timeline.

### **2\. Modules / plugins (Logic Layer)**

Chaque module est un package Python indépendant, découvert via les entry-points (synapsesync.modules).

**Contrat de module (interface conceptuelle)** :

class BaseModule(Protocol):  
    id: str  \# ex: "github"

    async def sync(self) \-\> None:  
        """  
        Récupère / met à jour les données (APIs, exporters, etc.)  
        et pousse des événements dans la Global Timeline.  
        """  
        ...

    def get\_widgets(self) \-\> list\[WidgetDescriptor\]:  
        """  
        Déclare les widgets disponibles (ID, type visuel, schéma de config).  
        """  
        ...

    async def get\_widget\_data(self, widget\_id: str, params: dict) \-\> WidgetData:  
        """  
        Retourne les données formatées pour le frontend, selon un format standardisé  
        (timeseries, list, counter, timeline, etc.).  
        """  
        ...

### **3\. Backend API (Core Layer)**

Framework : FastAPI \+ Pydantic.  
Rôle : fournir une API JSON propre et typée pour la configuration des dashboards, la récupération des données de widgets, la gestion des modules et l’interface avec l’IA.  
**Orchestration** :

* Planification des synchros via **APScheduler**.  
* File d’attente interne (Asyncio Queue) pour séquencer les synchros et éviter de surcharger la machine en V1.  
* Une task queue plus avancée (Arq/Saq) pourra être envisagée en V2.

**APIs principales** :

* **Widgets** : GET /api/widgets (liste) et GET /api/widget-data/{id} (données).  
* **Dashboards** : GET et POST sur /api/dashboards/{id} pour le layout et les paramètres.  
* **Modules** : GET /api/modules (état) et POST /api/modules/{id}/sync (force sync).  
* **IA** : POST /api/ai/query (question \+ contexte).

### **4\. Frontend (UI Layer)**

Framework : React \+ TypeScript.  
Objectif : dashboards modulaires configurables sans connaître la logique métier de chaque module.

* **Widget Registry** : Un registre de composants React (TimeseriesWidget, ListWidget, etc.) qui mappe le visual\_type envoyé par le backend au composant UI correspondant.  
* **Layout** : Système de grille modulaire (ex: react-grid-layout) pour déplacer et redimensionner les widgets.  
* **Offline-ready** : Fonctionnement local sans CDNs. Assets packagés (polices, icônes).

## **🧠 IA “Guide” & analyse**

L’IA est un module (synapsesync\_ai) avec un backend interchangeable :

* **IA locale** : Ollama, LM Studio, etc. (Recommandé).  
* **IA cloud** : OpenAI, etc. (Optionnel et désactivé par défaut).

### **V1 : Analyse de contexte filtré**

Le backend calcule des statistiques agrégées et des résumés à partir de la Global Timeline. L’IA reçoit une question et un contexte structuré (JSON) pour générer une analyse en langage naturel (ex: "Tu codes surtout tard le soir...").

### **V2 : RAG local (Vector DB)**

Utilisation d’une base vectorielle locale (**LanceDB**, **ChromaDB**) pour indexer le summary\_text de la Global Timeline. Permet à l’IA de répondre à des questions historiques fines (ex: "Quand ai-je lu ce manga pour la dernière fois ?").

## **⚙️ Stack technique (résumé)**

| Composant | Technologie |
| :---- | :---- |
| **Langages** | Python 3.10+ / TypeScript |
| **Backend** | FastAPI, Pydantic, SQLAlchemy, Alembic |
| **Frontend** | React, Tailwind CSS, Recharts ou ECharts |
| **Plugin system** | Python entry points (et éventuellement pluggy) |
| **IA locale** | Ollama (ou autre runtime) |
| **Packaging** | Navigateur (V1), Tauri / App desktop (V2) |

## **🧪 Roadmap de développement**

1. **Phase 1 : Noyau (MVP)** : FastAPI, SQLite, système de plugins, module GitHub pilote.  
2. **Phase 2 : UI & Dashboards** : SPA React, WidgetRegistry, premiers widgets, layout configurable.  
3. **Phase 3 : IA & Vie numérique** : Intégration Ollama, écran Assistant, modules Manga/Sport en lecture.  
4. **Phase 4 : Distribution** : Wizard de configuration, packaging Tauri, rapports hebdomadaires IA.

## **🔒 Confidentialité & sécurité**

* **Local-first** : Données, clés d'API et tokens stockés exclusivement en local.  
* **Isolation** : Aucune transmission tierce sans activation explicite.  
* **IA Locale** : Priorité au traitement on-device pour conserver un maximum de confidentialité.

⚠️ *Ce document décrit la vision cible. Certaines fonctionnalités avancées sont prévues pour les versions ultérieures.*