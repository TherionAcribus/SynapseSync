#!/usr/bin/env python3
"""
Script de lancement direct pour SynapseSync backend
Évite les problèmes d'environnement avec uv run/uvicorn
"""

import sys
import os

# Ajoute le répertoire src au PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

import uvicorn

if __name__ == "__main__":
    print(f"Python executable: {sys.executable}")
    print(f"Python path: {sys.path[:3]}...")  # Affiche les 3 premiers chemins
    
    # Lance avec uvicorn en utilisant une chaîne d'import pour le reload
    uvicorn.run(
        "synapsesync.main:app",  # Chaîne d'import pour le reload
        host="127.0.0.1", 
        port=8001, 
        reload=True,
        reload_dirs=["src"],  # Surveille seulement le répertoire src
        log_level="info"
    )
