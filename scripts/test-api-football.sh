#!/bin/bash
# Script de prueba rápida para API-Football usando curl
# Uso: ./scripts/test-api-football.sh YOUR_API_KEY

API_KEY="${1:-$SPORTS_API_KEY}"
BASE_URL="https://v3.football.api-sports.io"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}🧪 API-Football Quick Test${NC}"
echo -e "${CYAN}========================================${NC}"

# Verificar API key
if [ -z "$API_KEY" ]; then
  echo -e "\n${RED}❌ ERROR: API key no proporcionada${NC}"
  echo -e "\n${YELLOW}Uso:${NC}"
  echo -e "  ${BLUE}./scripts/test-api-football.sh YOUR_API_KEY${NC}"
  echo -e "  ${BLUE}SPORTS_API_KEY=YOUR_KEY ./scripts/test-api-football.sh${NC}"
  echo -e "\n${YELLOW}Obtén tu API key en:${NC}"
  echo -e "  ${BLUE}https://dashboard.api-football.com/${NC}"
  exit 1
fi

echo -e "\n${GREEN}✅ API Key: ${API_KEY:0:10}...${NC}"
echo -e "${BLUE}📡 Base URL: $BASE_URL${NC}\n"

# Test 1: Status
echo -e "${CYAN}🔍 Test 1: Status de la API${NC}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "x-apisports-key: $API_KEY" \
  "$BASE_URL/status" | jq '.'

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test 2: Timezone (verificar acceso básico)
echo -e "${CYAN}🔍 Test 2: Timezone (acceso básico)${NC}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "x-apisports-key: $API_KEY" \
  "$BASE_URL/timezone" | jq '.results, .response[0:3]'

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test 3: World Cup 2026
echo -e "${CYAN}🔍 Test 3: World Cup 2026${NC}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "x-apisports-key: $API_KEY" \
  "$BASE_URL/leagues?id=1&season=2026" | jq '.results, .response[0] | {league: .league.name, country: .country.name, season: .seasons[0]}'

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test 4: Equipos (primeros 5)
echo -e "${CYAN}🔍 Test 4: Equipos World Cup 2026 (primeros 5)${NC}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "x-apisports-key: $API_KEY" \
  "$BASE_URL/teams?league=1&season=2026" | jq '.results, .response[0:5] | .[] | {id: .team.id, name: .team.name, code: .team.code}'

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test 5: Fixtures (primeros 3)
echo -e "${CYAN}🔍 Test 5: Fixtures World Cup 2026 (primeros 3)${NC}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "x-apisports-key: $API_KEY" \
  "$BASE_URL/fixtures?league=1&season=2026" | jq '.results, .response[0:3] | .[] | {id: .fixture.id, date: .fixture.date, home: .teams.home.name, away: .teams.away.name, status: .fixture.status.short}'

echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}✅ Tests completados${NC}"
echo -e "${CYAN}========================================${NC}\n"
