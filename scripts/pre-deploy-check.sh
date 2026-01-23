#!/bin/bash

# Script de validation avant déploiement
# Lance tous les tests et vérifications nécessaires

set -e  # Exit on error

echo "🚀 Pré-Déploiement Check - AdsDecision"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $2${NC}"
    ((FAILED++))
  fi
}

# 1. Vérifier les dépendances
echo "📦 Vérification des dépendances..."
npm ci > /dev/null 2>&1
print_status $? "Dépendances installées"
echo ""

# 2. Linter
echo "🔍 Linting du code..."
npm run lint > /dev/null 2>&1
print_status $? "Lint passed"
echo ""

# 3. Build TypeScript
echo "🏗️  Build TypeScript..."
npx tsc --noEmit > /dev/null 2>&1
print_status $? "TypeScript compilation"
echo ""

# 4. Prisma
echo "🗄️  Vérification Prisma..."
npx prisma generate > /dev/null 2>&1
print_status $? "Prisma client generated"
echo ""

# 5. Tests unitaires
echo "🧪 Tests unitaires..."
npm run test:unit -- --passWithNoTests > /dev/null 2>&1
print_status $? "Tests unitaires"
echo ""

# 6. Tests d'intégration
echo "🔗 Tests d'intégration..."
npm run test:integration -- --passWithNoTests > /dev/null 2>&1
print_status $? "Tests d'intégration"
echo ""

# 7. Coverage
echo "📊 Vérification coverage..."
npm run test:coverage -- --silent > /dev/null 2>&1
COVERAGE=$(cat coverage/coverage-summary.json 2>/dev/null | grep -o '"lines":{"total":[0-9.]*,"covered":[0-9.]*,"skipped":[0-9.]*,"pct":[0-9.]*' | grep -o 'pct":[0-9.]*' | cut -d':' -f2 || echo "0")
if (( $(echo "$COVERAGE >= 80" | bc -l 2>/dev/null || echo "0") )); then
  print_status 0 "Coverage ≥ 80% ($COVERAGE%)"
else
  print_status 1 "Coverage < 80% ($COVERAGE%)"
fi
echo ""

# 8. Build Next.js
echo "🏗️  Build Next.js..."
npm run build > /dev/null 2>&1
print_status $? "Next.js build"
echo ""

# 9. Variables d'environnement
echo "🔐 Vérification variables d'environnement..."
if [ -f .env.local ]; then
  REQUIRED_VARS=("DATABASE_URL" "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "CLERK_SECRET_KEY")
  ALL_PRESENT=1
  for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$VAR=" .env.local; then
      echo -e "${YELLOW}⚠️  Missing: $VAR${NC}"
      ALL_PRESENT=0
    fi
  done
  print_status $ALL_PRESENT "Variables d'environnement"
else
  print_status 1 "Fichier .env.local introuvable"
fi
echo ""

# Résumé
echo "================================================="
echo "📈 RÉSUMÉ"
echo "================================================="
echo -e "${GREEN}✅ Passés: $PASSED${NC}"
echo -e "${RED}❌ Échoués: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 PRÊT POUR LE DÉPLOIEMENT!${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. git push origin main"
  echo "2. Vérifier CI/CD sur GitHub Actions"
  echo "3. Déployer sur Vercel"
  exit 0
else
  echo -e "${RED}⚠️  ÉCHEC - Corriger les erreurs avant de déployer${NC}"
  exit 1
fi
