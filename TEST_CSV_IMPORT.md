# Guide de Test - Import CSV Amélioré

## 🎯 Tests à Effectuer

### Test 1: Téléchargement du Template Enrichi ✅

1. Aller sur [http://localhost:3000/onboarding](http://localhost:3000/onboarding)
2. Cliquer sur **"Télécharger le template CSV"**
3. Ouvrir le fichier téléchargé dans Excel ou un éditeur de texte

**Résultat attendu:**
- Le fichier contient **14 jours de données** (42 lignes)
- Instructions claires en commentaires en haut du fichier
- 3 campagnes différentes (Webinaire, Lead Magnet, Démo Gratuite)
- Données réalistes avec variations jour par jour

### Test 2: Import Direct du Template (No-Brainer) ✅

1. Sans modifier le fichier téléchargé
2. Cliquer sur la zone de drop ou **"Sélectionner un fichier"**
3. Uploader le template tel quel

**Résultat attendu:**
- ✅ Import réussi immédiatement
- Affichage de l'écran de vérification avec:
  - 3 campagnes importées
  - ~840 leads générés
  - ~€3000 dépenses totales
  - Période de 14 jours
- Bouton **"✅ C'est correct, continuer"** visible

### Test 3: Messages d'Erreur Précis

#### 3a. Erreur de Format de Date

1. Modifier une ligne du template:
   ```csv
   Ad Test,Campagne,PROBLEME,12.5,250,20,1.2,2.5,01/20/2024
   ```
   (Changer `2026-01-20` en `01/20/2024`)

2. Uploader le fichier

**Résultat attendu:**
```
❌ Import partiel : 1 ligne(s) ignorée(s)

Détails des erreurs:
Ligne X - Colonne "date"
Date invalide "01/20/2024" - format requis : YYYY-MM-DD (ex: 2026-01-20)
Valeur actuelle : "01/20/2024"
```

#### 3b. Erreur de CPL Non Numérique

1. Modifier une ligne:
   ```csv
   Ad Test,Campagne,PROBLEME,abc,250,20,1.2,2.5,2026-01-20
   ```
   (Remplacer CPL par "abc")

2. Uploader

**Résultat attendu:**
```
Ligne X - Colonne "cpl"
CPL invalide "abc" - doit être un nombre positif (ex: 12.50)
Valeur actuelle : "abc"
```

#### 3c. Erreur de Valeur Négative

1. Modifier:
   ```csv
   Ad Test,Campagne,PROBLEME,-10.5,250,20,1.2,2.5,2026-01-20
   ```

2. Uploader

**Résultat attendu:**
```
Ligne X - Colonne "cpl"
CPL invalide "-10.5" - doit être un nombre positif (ex: 12.50)
```

### Test 4: CSV Corrigé Automatique (BONUS) ✅

1. Créer un fichier avec des données mixtes (valides + invalides):
   ```csv
   ad_name,campaign_name,angle,cpl,spend,leads,ctr,roas,date
   Ad Valid 1,Campaign A,PROBLEME,10.5,250,24,1.2,2.5,2026-01-20
   Ad Invalid,Campaign A,PROBLEME,abc,250,24,1.2,2.5,2026-01-21
   Ad Valid 2,Campaign B,MECANISME,12.0,300,25,1.5,3.0,2026-01-22
   Ad Invalid 2,Campaign B,MECANISME,15.0,300,25,1.5,3.0,01/23/2024
   ```

2. Uploader

**Résultat attendu:**
- Message: "Import partiel : 2 ligne(s) ignorée(s)"
- Affichage des 2 erreurs avec numéros de ligne
- **Section verte** avec bouton **"Télécharger le fichier corrigé"**
- Clic sur le bouton → télécharge `donnees_corrigees.csv`
- Ce fichier contient uniquement les 2 lignes valides

### Test 5: Colonnes Manquantes

1. Créer un CSV invalide:
   ```csv
   ad_name,cpl
   Ad Test,10.5
   ```

2. Uploader

**Résultat attendu:**
```
❌ Colonnes manquantes : spend, leads, date

Colonnes trouvées : ad_name, cpl

💡 Astuce : Téléchargez à nouveau le template pour avoir le bon format.
```

### Test 6: Pas Assez de Jours

1. Créer un CSV avec seulement 3 jours:
   ```csv
   ad_name,campaign_name,angle,cpl,spend,leads,ctr,roas,date
   Ad 1,Campaign A,PROBLEME,10.5,250,24,1.2,2.5,2026-01-20
   Ad 2,Campaign A,MECANISME,12.0,300,25,1.5,3.0,2026-01-21
   Ad 3,Campaign B,PREUVE,15.0,350,23,1.3,2.8,2026-01-22
   ```

2. Uploader

**Résultat attendu:**
```
❌ Pas assez de données

Le fichier contient seulement 3 jour(s) de données.
Minimum requis : 7 jours différents.

💡 Astuce : Téléchargez le template qui contient 14 jours de données exemples.
```

### Test 7: Suggestion de Re-téléchargement

1. Provoquer n'importe quelle erreur (ex: date invalide)
2. Vérifier la présence de la section bleue en bas:

**Résultat attendu:**
```
┌─────────────────────────────────────┐
│ 💡 Problème de format ?             │
│                                     │
│ Re-téléchargez le template et       │
│ copiez-collez vos données           │
│ directement dedans pour éviter      │
│ les erreurs.                        │
│                                     │
│ [📥 Re-télécharger le template]     │
└─────────────────────────────────────┘
```

3. Cliquer sur le bouton → télécharge un nouveau template

## ✅ Checklist Validation

- [ ] Template contient 42 lignes (14 jours × 3 campagnes)
- [ ] Template contient des instructions en commentaires
- [ ] Import du template tel quel fonctionne sans erreur
- [ ] Erreurs de date affichent le bon format attendu
- [ ] Erreurs de CPL invalide sont détectées
- [ ] Valeurs négatives sont rejetées
- [ ] CSV corrigé est généré pour erreurs partielles
- [ ] Colonnes manquantes sont détectées
- [ ] Minimum 7 jours est validé
- [ ] Bouton re-télécharger template apparaît en cas d'erreur
- [ ] Numéros de ligne sont corrects dans les erreurs

## 🎯 Comportement Attendu Global

### Flow Idéal (Utilisateur Sans Données)
```
1. Télécharge template
   ↓
2. Upload directement (tel quel)
   ↓
3. ✅ Voit 3 campagnes, 42 lignes, 14 jours
   ↓
4. Clique "C'est correct, continuer"
   ↓
5. Passe à l'étape 2 de l'onboarding
```

### Flow Idéal (Utilisateur Avec Données Excel)
```
1. Télécharge template
   ↓
2. Ouvre dans Excel, lit les instructions
   ↓
3. Copie-colle ses données Meta Ads
   ↓
4. Upload
   ↓
5. ✅ Import réussi
```

### Flow avec Erreur (Utilisateur fait une Faute)
```
1. Upload fichier avec erreurs
   ↓
2. ⚠️ Voit ligne X, colonne Y, "valeur actuelle"
   ↓
3. Option A: Télécharge CSV corrigé → re-upload
   Option B: Re-télécharge template → copie-colle
   ↓
4. ✅ Import réussi
```

## 🐛 Bugs Potentiels à Vérifier

- [ ] Numéros de ligne correspondent bien au fichier Excel (ligne 2 = première ligne de données)
- [ ] Caractères spéciaux dans les noms de pub sont supportés
- [ ] CSV avec BOM (byte order mark) fonctionne
- [ ] Espaces en trop dans les valeurs sont trimés
- [ ] Virgules dans les valeurs sont échappées correctement

## 📊 Performance

Le parsing doit être **instantané** même avec 42+ lignes:
- Temps d'upload: < 1 seconde
- Affichage des erreurs: immédiat
- Génération CSV corrigé: < 500ms

## 🎨 Interface

Vérifier que:
- Couleurs correspondent au type de message (rouge=erreur, vert=succès, orange=warning, bleu=info)
- Icônes sont visibles (AlertCircle, CheckCircle2, Download)
- Texte est lisible avec bon contraste
- Boutons ont hover states
- Responsive sur mobile

---

**URL de test:** [http://localhost:3000/onboarding](http://localhost:3000/onboarding)
