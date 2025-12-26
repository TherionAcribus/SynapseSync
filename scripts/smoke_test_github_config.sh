#!/bin/bash
# Smoke test des nouveaux endpoints de configuration GitHub
# Prérequis : backend lancé sur http://127.0.0.1:8001

BASE="http://127.0.0.1:8001/api"

echo "=== 1. Vérifier que la table module_configs existe (GET config, doit être vide au départ) ==="
curl -s "${BASE}/modules/github/config" | jq .

echo -e "\n=== 2. Test config API GitHub (username obligatoire) ==="
curl -s -X POST "${BASE}/modules/github/test" \
  -H "Content-Type: application/json" \
  -d '{"config_json": {"provider": "api", "username": "octocat"}}' | jq .

echo -e "\n=== 3. Sauver config API GitHub ==="
curl -s -X POST "${BASE}/modules/github/config" \
  -H "Content-Type: application/json" \
  -d '{"config_json": {"provider": "api", "username": "octocat", "token": ""}}' | jq .

echo -e "\n=== 4. Relire config (doit contenir provider/api) ==="
curl -s "${BASE}/modules/github/config" | jq .

echo -e "\n=== 5. Test config HPI (échouera si HPI non installé) ==="
curl -s -X POST "${BASE}/modules/github/test" \
  -H "Content-Type: application/json" \
  -d '{"config_json": {"provider": "hpi"}}' | jq .

echo -e "\n=== 6. Basculer vers HPI (si tu veux) ==="
curl -s -X POST "${BASE}/modules/github/config" \
  -H "Content-Type: application/json" \
  -d '{"config_json": {"provider": "hpi"}}' | jq .

echo -e "\n=== 7. Relire config (doit maintenant être provider=hpi) ==="
curl -s "${BASE}/modules/github/config" | jq .

echo -e "\n=== 8. Sync GitHub (via API ou HPI selon la config) ==="
curl -s -X POST "${BASE}/modules/github/sync" | jq .

echo -e "\n=== 9. Vérifier les widgets GitHub (liste) ==="
curl -s "${BASE}/widgets" | jq '.[] | select(.module_id == "github")'
