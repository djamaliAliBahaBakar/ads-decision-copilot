# Guide de Tests - AdsDecision

Ce projet utilise une suite complète de tests pour garantir la qualité du code avant déploiement.

## 🧪 Types de Tests

### 1. Tests Unitaires
Tests des fonctions utilitaires et helpers isolés.

**Exemples:**
- `lib/__tests__/csv-parser.test.ts` - Parsing CSV
- Calculs de métriques
- Fonctions de date

### 2. Tests d'Intégration
Tests des Server Actions et API routes.

**Exemples:**
- `app/api/onboarding/__tests__/create-default-rules.test.ts` - Création règles par défaut
- Routes API
- Interactions avec la base de données (mockée)

### 3. Tests End-to-End (E2E)
Tests du parcours utilisateur complet dans le navigateur.

**Exemples:**
- `e2e/onboarding.spec.ts` - Flow d'onboarding
- Upload CSV
- Création de décisions

## 📦 Installation

Installer les dépendances de test:

```bash
npm install
```

Installer les navigateurs Playwright (pour E2E):

```bash
npx playwright install
```

## 🚀 Commandes de Test

### Tests en Mode Watch (Développement)
```bash
npm run test
```
Lance Jest en mode watch pour les tests unitaires et d'intégration.

### Tests Unitaires Seulement
```bash
npm run test:unit
```

### Tests d'Intégration Seulement
```bash
npm run test:integration
```

### Tests E2E
```bash
npm run test:e2e
```

### Tests E2E avec UI (Mode Interactif)
```bash
npm run test:e2e:ui
```

### Tous les Tests (CI)
```bash
npm run test:ci
```
Lance tous les tests avec coverage. Utilisé en CI/CD.

### Coverage
```bash
npm run test:coverage
```
Génère un rapport de couverture de code.

## 📊 Interpréter les Résultats

### Coverage Targets
- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

### Où Voir le Coverage
Après `npm run test:coverage`, ouvrir:
```
coverage/lcov-report/index.html
```

## 🔧 Écrire des Tests

### Structure d'un Test Unitaire

```typescript
import { parseCSV } from '../csv-parser'

describe('CSV Parser', () => {
  it('should parse valid CSV data', async () => {
    // Arrange
    const csvData = `ad_name,cpl,spend,leads,date
Ad Test,10.5,250,30,2024-01-20`

    // Act
    const result = await parseCSV(csvData)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].cpl).toBe(10.5)
  })
})
```

### Structure d'un Test d'Intégration

```typescript
import { POST } from '../route'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('POST /api/example', () => {
  it('should return success', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/example', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

### Structure d'un Test E2E

```typescript
import { test, expect } from '@playwright/test'

test('should complete onboarding', async ({ page }) => {
  // Navigate
  await page.goto('/onboarding')

  // Interact
  await page.getByText('Upload CSV').click()

  // Assert
  await expect(page.getByText('Import réussi!')).toBeVisible()
})
```

## 🐛 Debugging

### Tests Unitaires
Utiliser VS Code debugger ou:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Tests E2E
Mode interactif avec UI:
```bash
npm run test:e2e:ui
```

Ou avec headed browser:
```bash
npx playwright test --headed
```

## 🔄 CI/CD

Les tests s'exécutent automatiquement sur GitHub Actions:

- **Push sur main/develop**: Tous les tests
- **Pull Request**: Tous les tests
- **Status**: ✅ Doit passer avant merge

Voir `.github/workflows/test.yml` pour la configuration.

## 📝 Best Practices

1. **Écrire les tests avant de commit**
   ```bash
   npm run test:all
   ```

2. **Maintenir coverage > 80%**
   ```bash
   npm run test:coverage
   ```

3. **Tester les cas limites**
   - Données invalides
   - Erreurs réseau
   - États vides

4. **Noms descriptifs**
   ```typescript
   it('should throw error when CSV has missing required fields', ...)
   ```

5. **Arrange-Act-Assert**
   Structurer les tests en 3 parties claires.

## 🚨 Erreurs Communes

### "Cannot find module '@/...'"
Solution: Vérifier `jest.config.js` - `moduleNameMapper`

### "ReferenceError: fetch is not defined"
Solution: Utiliser `global.fetch = jest.fn()`

### "Timeout" sur tests E2E
Solution: Augmenter timeout dans `playwright.config.ts`

```typescript
use: {
  timeout: 60000,
}
```

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

## ✅ Checklist Avant Déploiement

- [ ] `npm run test:all` passe ✅
- [ ] Coverage > 80% ✅
- [ ] Pas de tests skippés (.skip) ✅
- [ ] Tests E2E sur flows critiques ✅
- [ ] CI/CD vert ✅
