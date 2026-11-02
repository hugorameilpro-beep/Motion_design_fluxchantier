# Casque anti-bruit sur chantier : les risques à ne pas prendre

Vidéo de sensibilisation sécurité en motion design, sans son. Elle est faite pour l'accueil sécurité, les
causeries, les écrans de chantier et WhatsApp. Le message passe uniquement par l'image et par des textes
courts, lisibles par des compagnons peu francophones.

| Livrable | Format | Fichier |
|---|---|---|
| Vidéo téléphone | 1080×1920 (9:16), 30 i/s, H.264, sans son | [`output/securite_bruit_vertical.mp4`](output/securite_bruit_vertical.mp4) |
| Vidéo projection | 1920×1080 (16:9), 30 i/s, H.264, sans son | [`output/securite_bruit_horizontal.mp4`](output/securite_bruit_horizontal.mp4) |
| Affiche | A3 portrait, 3508×4961 px (300 dpi) | [`output/securite_bruit_affiche_A3.png`](output/securite_bruit_affiche_A3.png) |

Les deux vidéos durent **57,7 s**.

<img src="output/securite_bruit_affiche_A3.png" width="320" alt="Affiche A3">

## Déroulé

| # | Durée | Scène |
|---|---|---|
| 0 | 2 s | Logo Dumez sur une carte blanche, puis titre « Casque anti-bruit sur chantier ». |
| 1 | 4 s | Chantier stylisé. Les ondes sonores grossissent et l'image tremble. « Le bruit ne fait pas mal… » puis, sur un bandeau rouge, « …tant qu'on ne l'a pas perdu. » |
| 2 | 10 s | Jauge verticale à trois paliers. **80 dB(A)** : protections mises à disposition. **85 dB(A)** : port obligatoire, avec le panneau bleu. **87 dB(A)** : limite à ne jamais dépasser, protection comprise. Mentions secondaires : valeurs sur 8 h, crêtes 135 / 137 / 140 dB(C). |
| 3a | 6 s | Pour vos oreilles. La courbe d'audition descend, l'oreille siffle. Quatre effets : acouphènes, fatigue auditive, hyperacousie, perte définitive. |
| 3b | 12 s | Pour le corps et la sécurité : stress, fatigue, sommeil. Un engin recule et l'ouvrier ne l'entend pas : alerte rouge. Puis la même scène **organisée** : protecteur adapté bien porté, gyrophare visible, signaleur et gestes convenus. L'ouvrier s'écarte, l'engin s'arrête. Message fort : « Une oreille abîmée ne se répare pas. » |
| 4 | 14 s | Cinq cartes hexagonales : choisir son protecteur (bouchons, bouchons à cordelette, coquilles sur casque, serre-tête), bien l'ajuster, le porter tout le temps, le garder propre et le remplacer, respecter les zones signalées et les pauses. |
| 5 | 5 s | « Dès 85 dB(A) : protection obligatoire. » puis « Votre audition ne se remplace pas. » Logos sur fond blanc. |

Les transitions sont des **vagues d'hexagones** bleus : c'est la forme du logo Dumez.

## Règles de contenu

- **Aucun chiffre inventé.** Seuls figurent les seuils réglementaires du Code du travail (art. R4431-2) repris par l'INRS :
  - 80 dB(A) et 135 dB(C) : valeurs d'exposition inférieures déclenchant l'action ;
  - 85 dB(A) et 137 dB(C) : valeurs supérieures ;
  - 87 dB(A) et 140 dB(C) : valeurs limites, atténuation du protecteur comprise.

  Ces valeurs portent sur 8 h de travail.
- **Pas de niveau en dB pour les machines.** Par défaut, la vidéo affiche « Bruyant » ou « Très bruyant ». Un niveau précis n'apparaît que s'il est renseigné dans `sources_bruit` **avec sa source** (voir plus bas).

## Identité visuelle

La palette a été extraite du logo `assets/logo_dumez.png`, et **aucune autre couleur n'est utilisée** :

| Rôle | Couleur |
|---|---|
| Bleu Dumez : couleur dominante, titres, cartes, panneau d'obligation | `#004489` (texte « DUMEZ » et haut de l'hexagone) |
| Bleu très foncé : fonds | `#001F3D` (même teinte, assombrie) |
| Rouge Dumez : danger, conséquences, dépassement | `#FA000C` (bas de l'hexagone) |
| Blanc : fonds et textes sur couleur | `#FFFFFF` |

**Contrastes** (norme WCAG), pour une lecture de loin et au soleil :

| Texte | Fond | Contraste |
|---|---|---|
| Blanc | bleu foncé | 16,6:1 |
| Blanc | bleu Dumez | 9,6:1 |
| Blanc | rouge | 4,1:1 |
| Rouge | blanc | 4,1:1 |

Le rouge n'accueille que du texte **très gros et gras** : au moins 64 px en vertical, alors que le seuil « grand texte » est de 3:1. Le rouge sur bleu (2,3:1) n'est jamais utilisé pour du texte.

**Typographie** : Inter, embarquée dans `assets/fonts/` (licence OFL). Elle couvre aussi les accents roumains, polonais, etc.
- Tout texte fait **au moins 64 px en vertical** et 48 px en horizontal.
- Une ligne contient **6 mots au maximum**.
- Le rendu vérifie ces deux règles et le signale si un texte les enfreint.

## Modifier les textes ou traduire

Tous les textes sont dans [`config.json`](config.json), sous `textes.fr`. Un `\n` force un retour à la ligne. Les lignes trop longues sont réduites automatiquement, sans descendre sous le minimum.

Pour **ajouter une langue** (anglais, roumain, portugais…) :

1. Copiez le bloc `"fr": { … }` à côté de lui, sous `textes`, en le renommant par exemple `"ro": { … }`, puis traduisez les valeurs. Une clé absente reprend le texte français.
2. Générez la version : `npm run render -- --lang ro`. Les fichiers prennent le suffixe `_ro`, par exemple `output/securite_bruit_vertical_ro.mp4`.
3. Ou changez `"langue": "ro"` pour en faire la langue par défaut.

Pensez à garder les retours à la ligne courts : 6 mots au maximum par ligne.

## Logos

```json
"logos": {
  "entreprise": "assets/logo_dumez.png",
  "chantier": "",
  "synapsis": "assets/logo_synapsis.png",
  "agrandissement_max": 1.3
},
"show_synapsis_credit": false
```

- **`entreprise`** : le logo affiché en ouverture et en scène finale, sur fond blanc, avec une zone de protection d'au moins la hauteur du « H » de DUMEZ.
  - Il n'est ni déformé ni recoloré, et jamais agrandi au-delà de `agrandissement_max` (1,3 fois). Sur l'affiche, cette limite s'applique aux pixels imprimés.
  - Le fichier actuel fait 421×120 px. **Remplacez-le par une version HD** (PNG transparent, au moins 1500 px de large) : il apparaîtra alors plus grand sans perdre en netteté.
- **`chantier`** : chemin vers un logo de chantier, optionnel. Vide, il n'est pas affiché.
- **`show_synapsis_credit`** : `true` ajoute la ligne « Réalisé par Synapsis » en dernière scène et sur l'affiche.

## Niveaux de bruit des machines (optionnel)

Par défaut, `"sources_bruit": []`. Pour afficher un niveau mesuré, ajoutez une entrée **avec sa source** :

```json
"sources_bruit": [
  { "id": "marteau_piqueur", "niveau": "…", "source": "Mesure du … sur le chantier de …" },
  { "id": "engin", "niveau": "…", "source": "…" }
]
```

Le niveau remplace « Très bruyant » ou « Bruyant » sur l'étiquette de la machine, et la source s'affiche en bas de l'écran. Une entrée sans `source` est ignorée.

## Installation

Il faut **Node.js 18 ou plus récent** et **ffmpeg**.

```bash
cd securite-bruit
npm install                       # GSAP + Playwright (aucune dépendance réseau au rendu)
npx playwright install chromium   # navigateur utilisé pour le rendu (une seule fois)
```

ffmpeg :
- Linux : `sudo apt install ffmpeg`
- macOS : `brew install ffmpeg`
- Windows : `winget install ffmpeg`

## Prévisualiser

```bash
npm run dev
```

Ouvrez ensuite l'une de ces adresses :
- <http://localhost:5174/src/index.html?format=vertical>
- <http://localhost:5174/src/index.html?format=horizontal>
- <http://localhost:5174/src/index.html?format=affiche>

Le curseur en bas fait avancer la timeline ; la touche **Espace** lance ou met en pause. Ajoutez à l'adresse :
- `&t=30` pour ouvrir à 30 s ;
- `&lang=ro` pour voir une traduction.

## Générer

```bash
npm run render              # les deux vidéos + l'affiche
npm run render:vertical     # vidéo 9:16 seule
npm run render:horizontal   # vidéo 16:9 seule
npm run render:affiche      # affiche A3 seule
npm run stills -- 12,30.5   # quelques images clés dans frames/stills/ (vérification rapide)
```

Le rendu est **déterministe**, sans enregistrement d'écran :
1. Playwright ouvre la page au format exact.
2. Il avance l'unique timeline GSAP (`window.tl`) image par image, à 30 i/s, et capture chaque image en PNG.
3. ffmpeg assemble ces images en MP4.

Les images temporaires vont dans `frames/`, ignoré par git. Comptez environ 5 minutes par vidéo. Avec `WORKERS=8 npm run render`, le rendu va plus vite sur une machine puissante.

## Organisation

| Chemin | Rôle |
|---|---|
| `config.json` | Palette, logos, crédit, sources de bruit et **tous les textes**. |
| `src/index.html` | Page unique : `?format=vertical`, `horizontal` ou `affiche`, et `&lang=`. |
| `src/styles.css` | Variables de couleur (remplies depuis `config.json`), échelle typographique par format. |
| `src/js/lib.js` | Textes masqués multi-lignes, ajustement automatique, motif hexagonal, transitions. |
| `src/js/pictos.js` | Panneau d'obligation (style ISO 7010), panneau de danger, pictogrammes SVG. |
| `src/js/scenes.js` | Les six scènes et leur animation. |
| `src/js/poster.js` | Mise en page de l'affiche A3. |
| `src/js/main.js` | Chargement, timeline unique `window.tl`, contrôles des textes, aperçu. |
| `scripts/render.mjs` | Rendu image par image, puis MP4 et affiche. |
| `scripts/dev.mjs` | Serveur de prévisualisation. |
| `output/` | Fichiers finaux (versionnés). |
