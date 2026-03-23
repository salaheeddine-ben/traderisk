# NEURO-ADVISOR SIMULATOR v3.0

Application web de simulation de trading pour une thèse de doctorat en **finance comportementale** — Université de Lille.

## Objectif scientifique

Mesurer l'écart entre le profil de risque **déclaré** et le comportement **réel** sous stress, et évaluer l'efficacité d'une intervention **JITAI** (Just-In-Time Adaptive Intervention) empathique durant un krach boursier simulé.

**Hypothèse :** Une intervention empathique déclenchée en temps réel durant un krach simulé réduit les décisions irrationnelles (vente panique) chez les investisseurs stressés.

---

## Stack technique

| Élément | Version |
|---|---|
| React | 18.2 |
| Vite | 5.0 |
| Chart.js | 4.4 |
| react-chartjs-2 | 5.2 |

---

## Installation

```bash
git clone <repo>
cd neuro-advisor-simulator
npm install
npm run dev        # → http://localhost:3000
npm run build      # Production build
npm run preview    # Preview build
```

---

## Paramètres URL

| Paramètre | Exemple | Description |
|---|---|---|
| `id` | `?id=P001` | Identifiant du participant |

**Exemples :**
- `http://localhost:3000/?id=P001`
- `http://localhost:3000/?id=P042`

> Si aucun ID n'est fourni, l'application utilise `P001` par défaut.

---

## Design expérimental

### Randomisation

- L'assignation au groupe **A** ou **B** est déterminée par un hash de l'ID participant.
- La même ID voit **toujours** le même groupe (persisté en `localStorage`).
- Le participant ne sait **jamais** dans quel groupe il se trouve.

| Groupe | Comportement lors de la tentative de vente pendant le krach |
|---|---|
| **A — Contrôle** | Vente immédiate, sans friction |
| **B — Expérimental** | Si stress > 70% : overlay JITAI avec timer 30s avant de pouvoir vendre |

### Scénario de marché (identique pour tous)

| Phase | Durée | Mouvement | Prix indicatif |
|---|---|---|---|
| 1 — Confiance | T=0 → T=180s | +2% | 100€ → ~102€ |
| 2 — **KRACH** | T=180 → T=210s | **-15%** | 102€ → ~86.7€ |
| 3 — Rebond | T=210 → T=240s | +9% | 86.7€ → ~94.5€ |
| 4 — Stabilisation | T=240 → T=300s | +5% | 94.5€ → ~99€ |

> La timeline est générée **une seule fois** avec un PRNG à graine fixe (mulberry32, seed=20240101). Tous les participants voient **exactement** la même évolution de prix.

---

## Panneau Chercheur (Admin)

Raccourci clavier : **`Ctrl + Shift + D`** (Windows/Linux) ou **`Cmd + Shift + D`** (Mac)

Affiche en bas à droite :
- ID, Âge, Sexe
- Groupe (A ou B)
- Profil de risque
- Stress actuel
- Temps écoulé et phase de marché

---

## Export CSV

Le bouton **"Télécharger les données (CSV)"** sur l'écran de fin génère un fichier avec **32 variables** :

### Identification (6)
`ID_Participant`, `Age`, `Sexe`, `Groupe`, `Profil_Risque`, `Lambda_Estime`

### Comportement décisionnel (5)
`Temps_Avant_Vente`, `A_Vendu_Panic`, `Nb_Clics_Vente`, `Nb_Clics_Achat`, `Temps_Reaction_Premier_Clic`

### Performance (3)
`Prix_Vente`, `Performance_Finale`, `Perte_Evitee`

### Stress — mesures répétées (7)
`Stress_Max`, `Stress_T0`, `Stress_T1`, `Stress_T2`, `Stress_T3_Krach`, `Stress_T4`, `Stress_T5`

### Intervention JITAI (3)
`JITAI_Declenche`, `JITAI_Attente_Complete`, `JITAI_Choix_Final`

### Métadonnées (3)
`Date_Experimentation`, `Heure_Debut`, `Duree_Totale_Secondes`

### Réponses questionnaire (5)
`Reponse_Q1`, `Reponse_Q2`, `Reponse_Q3`, `Reponse_Q4`, `Reponse_Q5`

**Nom du fichier :** `neuroadvisor_[ID]_[timestamp].csv`

---

## Tests de validation

### Reproductibilité

```
1. Ouvrir ?id=P001 dans 3 onglets → même groupe à chaque fois
2. Ouvrir ?id=P001 et ?id=P002 → groupes peuvent différer
3. Attendre T=180s sans interaction → le krach démarre exactement à T=180s
4. Fermer et rouvrir ?id=P001 → même groupe qu'avant
```

### Groupe A

```
1. Cliquer "Vendre" à T=190s (krach) → vente immédiate, pas de modal
2. CSV : JITAI_Declenche = "NA"
```

### Groupe B

```
1. Cliquer "Vendre" à T=50s → vente immédiate (pas de krach)
2. Cliquer "Vendre" à T=195s avec stress > 70% → modal JITAI s'affiche
3. Vérifier bouton "Vendre" désactivé + "Patientez..." pendant 30s
4. Cliquer "Je garde mes parts" → modal fermée, simulation continue
5. Attendre 30s + cliquer "Vendre" → CSV : JITAI_Attente_Complete = "OUI"
```

### Export

```
1. Compléter une session → télécharger CSV
2. Vérifier les 32 colonnes présentes
3. Vérifier Age (entier) et Sexe ("Homme" ou "Femme")
4. Vérifier cohérence entre actions et valeurs CSV
```

---

## Déploiement

### Vercel

```bash
npm install -g vercel
vercel
# ou : vercel --prod
```

### Netlify

```bash
npm run build
# Déployer le dossier dist/
```

---

## Structure du projet

```
src/
├── App.jsx                    # Routing entre les 3 écrans
├── main.jsx                   # Entry point React
├── index.css                  # Design system complet
├── utils/
│   ├── marketData.js          # Timeline déterministe (PRNG seed fixe)
│   ├── stressCalc.js          # Algorithme de calcul du stress
│   ├── csvExport.js           # Génération et téléchargement CSV
│   └── randomization.js      # Assignation groupe A/B
└── components/
    ├── Onboarding.jsx         # Écran 1 : démographie + questionnaire
    ├── TradingInterface.jsx   # Écran 2 : simulation de trading (5 min)
    ├── JITAIOverlay.jsx       # Modal JITAI (groupe B uniquement)
    ├── EndScreen.jsx          # Écran 3 : résultats + export CSV
    └── ResearcherPanel.jsx    # Panneau admin (Ctrl+Shift+D)
```

---

## Composition ETF Aurelia

| Catégorie | Actifs | Poids total |
|---|---|---|
| Actions | NOVA, VELM, KRYS, LUMI, ASTE, PHYX, TERR, MAVI, AQUA, NEON | 60% |
| Obligations | OBL-EUR, OBL-CORP | 25% |
| Cryptomonnaies | ₿ BTC-ETF, Ξ ETH-ETF | 10% |
| Immobilier | SCPI-EUR | 5% |

---

*Université de Lille — Laboratoire de Finance Comportementale — 2024*
