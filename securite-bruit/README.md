# Casque anti-bruit sur chantier : les risques à ne pas prendre

Vidéo de sensibilisation sécurité en motion design, sans son. Elle est faite pour l'accueil sécurité, les
causeries, les écrans de chantier et WhatsApp. Le message passe uniquement par l'image et par des textes
courts, lisibles par des compagnons peu francophones : **une idée par écran, peu de mots, chaque texte laissé
le temps d'être lu.**

| Livrable | Format | Fichier |
|---|---|---|
| Vidéo projection | 1920×1080 (16:9), 30 i/s, H.264, sans piste audio, **142,1 s** | [`output/securite_bruit_horizontal.mp4`](output/securite_bruit_horizontal.mp4) |
| Vidéo téléphone | 1080×1920 (9:16), 30 i/s, H.264, sans son, 57,7 s | [`output/securite_bruit_vertical.mp4`](output/securite_bruit_vertical.mp4) |
| Affiche | A3 portrait, 3508×4961 px (300 dpi) | [`output/securite_bruit_affiche_A3.png`](output/securite_bruit_affiche_A3.png) |

Seule la version **16:9** suit les règles de lecture ci-dessous. Ses scènes sont dans `src/js/scenes-h.js` et ses
textes dans `config.json`, sous `textes.fr.h`. La vidéo verticale et l'affiche gardent leur code (`scenes.js`,
`poster.js`) et leurs textes (le reste de `textes.fr`). Ce sont les versions validées précédemment : elles n'ont
été ni régénérées ni contrôlées.

<img src="output/securite_bruit_affiche_A3.png" width="320" alt="Affiche A3">

## Règles de lecture (16:9)

Elles sont communes avec [`../securite-poussieres/`](../securite-poussieres/README.md) et vérifiées à chaque rendu.

| Règle | Valeur |
|---|---|
| Idées par écran | Une seule. Au plus **3 blocs de texte** visibles en même temps, et au plus **10 mots** pour un message principal. Les étiquettes d'une grille d'icônes (outils, effets sur l'oreille, stress / fatigue / sommeil, types de protecteurs) ne comptent pas dans cette limite. |
| Temps de lecture minimum | Durée pendant laquelle un texte est entièrement visible et immobile : **max(2,5 s ; 0,5 s par mot + 1 s)**. Une étiquette d'icône reste au moins **2 s**. |
| Ordre d'apparition | Aucun nouveau texte n'apparaît pendant qu'on lit le précédent. Seul un titre qui reste affiché toute la scène peut avoir des textes après lui. |
| Fin de scène | **0,5 s de pause fixe** avant la transition. |
| Taille du texte | **72 px** minimum pour les messages principaux, **56 px** pour les secondaires, 48 px partout ailleurs. |
| Petites mentions | Aucune, sauf « Ordres de grandeur. » (une ligne, 48 px) dans la scène des outils. |

Les durées ne sont pas fixées à la main. Chaque temps de lecture est **calculé à partir du nombre de mots** du
texte de `config.json`. Une traduction plus longue rallonge donc la scène automatiquement.

## Déroulé et temps de chaque scène (16:9)

Les temps sont affichés à la fin du rendu. Chaque durée inclut la transition vers la scène suivante.

| # | Scène | Début | Durée | À l'écran |
|---|---|---|---|---|
| 0 | Ouverture | 0,0 s | 4,6 s | Logo Dumez sur une carte blanche, puis le titre « Casque anti-bruit sur chantier » en fondu : aucune ligne coupée à la première image. |
| 1 | Accroche | 4,6 s | 9,9 s | Chantier stylisé, ondes sonores, l'image tremble. « Le bruit ne fait pas mal… » puis, sur un bandeau rouge, « …tant qu'on ne l'a pas perdu. » Les ondes et le tremblement s'arrêtent avant la pause. |
| 2 | Seuils | 14,5 s | 15,2 s | Jauge à trois paliers, lus l'un après l'autre : **80 dB(A)** protections mises à disposition, **85 dB(A)** port obligatoire (panneau bleu), **87 dB(A)** limite à ne jamais dépasser, protection comprise (bandeau rouge). |
| 2b | Outils | 29,7 s | 29,2 s | « Pas seulement les gros engins. » et « Ordres de grandeur. » dès le début. La première carte arrive à 0,26 s, puis une carte toutes les 2,5 s, **par bruit croissant** : disqueuse / meuleuse, brise-roche hydraulique, perforateur / burineur, scie à sol, marteau-piqueur, pistolet de scellement (impulsionnel, « Coup sec »). Les étiquettes restent jusqu'à la fin. La grille complète reste 4 s. Plus de jauge ni de petites icônes autour : au-dessus de 85 dB(A), la carte porte un liseré rouge et le mini panneau d'obligation. Puis « Le niveau ET le temps passé comptent. » et « Le bruit du voisin compte aussi. » |
| 3a | Oreilles | 59,0 s | 12,2 s | Le titre « Pour vos oreilles » et le premier effet apparaissent tout de suite, sans écran vide. La courbe d'audition descend. Viennent quatre effets d'au moins 2,5 s chacun : acouphènes, fatigue auditive, hyperacousie, perte définitive (en rouge sur un cartouche blanc). |
| 3b | Corps et sécurité | 71,2 s | 26,2 s | Stress, fatigue, sommeil : 2,5 s chacun, puis les trois ensemble 3 s. L'engin recule et l'ouvrier ne l'entend pas : « On n'entend plus l'alarme, l'engin qui recule, son collègue. » Puis la scène organisée : « Protection adaptée + signaux visibles » (tenu 4 s), gyrophare, signaleur. **L'ouvrier se retourne vers l'engin, repart et entre dans la « Zone sûre »** (zone en pointillés, nommée au sol), puis fait face à l'engin. Un hexagone rouge couvre l'écran en 0,3 s, et « Une oreille abîmée ne se répare pas. » est là dès que le rouge l'est. Le texte reste 4,5 s, puis l'hexagone de transition prend le relais, sans écran vide. |
| 4 | Bons réflexes | 97,4 s | 28,6 s | Cinq cartes, dont les deux premières durent au moins 4,5 s : choisir son protecteur (les quatre types arrivent ensemble), bien l'ajuster (2 lignes courtes), le porter tout le temps, le garder propre, respecter les zones et les pauses. Sur la carte 5, le badge « pause » est à gauche de l'image et ne couvre plus le texte. Les points de pagination sortent en fondu avec la dernière carte. |
| 5 | Message final | 125,9 s | 9,4 s | Composition centrée dans les deux sens : grand panneau (440 px), textes en 100 px, logo Dumez en dessous (1,3x au maximum). « Dès 85 dB(A) : protection obligatoire. » puis « Votre audition ne se remplace pas. » |
| 6 | Générique | 135,4 s | 6,7 s | Des ondes convergent et tracent l'hexagone du logo à **sa taille et sa position exactes**, mesurées dans le fichier du logo. Viennent ensuite le bleu plein `#004489`, puis le bas rouge plein `#FA000C`. Les couleurs sont révélées par découpe, sans transparence ni mélange, donc jamais violettes. Le logo apparaît dessus sans saut. « Protégez votre audition. », puis 1 s de maintien. |
| | **Total** | | **142,1 s** | |

**Transitions** : la même partout. Un seul hexagone bleu, pointe en haut, grandit depuis le centre jusqu'à couvrir
l'écran, puis une ouverture hexagonale révèle la scène suivante (0,8 s). Les textes apparaissent par un fondu
simple : plus aucune ligne coupée.

**Pourquoi 142 s et pas 100 à 115 s.** Les minimums demandés et les règles de lecture fixent à eux seuls la
plus grande partie de la durée :
- outils : 6 cartes × 2,5 s + 4 s de grille, soit 19 s, plus les deux messages qui suivent (9 s) ;
- corps et sécurité : 3 × 2,5 s + 3 s, puis 5,5 s, 4 s et 4,5 s de lecture ;
- réflexes : cinq cartes de 4,5 à 6 s.

Comme demandé, les durées suivent les règles et non l'inverse. Pour descendre vers 110–115 s, il faut retirer du
texte. Ces coupes sont à valider :

| Coupe possible | Gain |
|---|---|
| « Le niveau ET le temps passé comptent. » et « Le bruit du voisin compte aussi. » (fin de la scène des outils) | ≈ 10 s |
| Message final, puisque le générique le suit avec « Protégez votre audition. » | ≈ 9 s |
| Une seule phrase d'accroche | ≈ 4,5 s |
| Ouverture avec le logo seul, sans titre | ≈ 3 s |
| Oreilles : 3 effets au lieu de 4 | ≈ 3 s |
| Carte 5 réduite à « Respectez les zones signalées » | ≈ 2 s |

## Contrôles automatiques

Les deux contrôles viennent du dossier partagé [`../outils-video/`](../outils-video/) : `lisibilite.js` est
injecté dans la page, et `controles.mjs` lance les analyses. La vidéo sur les poussières utilise les mêmes.

```bash
npm run lisibilite   # tableau de lisibilité + temps des scènes + images de lecture + planches de contact
npm run controle     # contrôle d'anomalies (page + MP4 existant)
npm run render -- --format horizontal   # les deux, puis le MP4 ; s'arrête si un texte ne respecte pas les règles
```

**Lisibilité.** Toute la timeline est parcourue à 30 i/s. Pour chaque texte, ou groupe lu ensemble (valeur et
texte d'un seuil, titre et lignes d'une carte, nom et niveau d'un outil), le contrôle mesure :
- le nombre de mots ;
- le temps pendant lequel le texte est entièrement visible et immobile ;
- la durée minimale requise.

Il signale un texte trop court, un texte qui apparaît pendant la lecture d'un autre, et plus de 3 blocs à la fois.
Il produit aussi :
- une image au milieu de chaque lecture, dans `frames/lecture/` ;
- des planches de contact 4×4, dans `frames/planches/`.

En cas de problème, le rendu s'arrête. L'option `--no-strict` permet de rendre quand même.

**Anomalies.** Le contrôle vérifie dans la page :
- les textes recouverts par un autre élément ;
- les lignes tronquées ;
- les textes hors cadre.

Il vérifie dans le MP4 :
- les écrans presque vides plus de 0,6 s ;
- les coupures sèches ;
- les mélanges violets (rouge et bleu mêlés sur une zone) ;
- les fins de scène qui bougent pendant la pause de 0,5 s.

Le rapport est enregistré dans `frames/controle/rapport.json`. L'écran presque vide du générique est **attendu** :
l'hexagone s'y dessine à la taille réelle de celui du logo. Il est signalé à part et n'est pas compté comme anomalie.

Résultat actuel : **lisibilité OK pour les 40 textes, aucune anomalie.** Avant la reprise, on comptait :
- **71 problèmes de lisibilité**, dont 21 blocs visibles à la fois dans la scène des outils ;
- **72 anomalies** : 60 lignes tronquées, 5 textes recouverts, 1 texte hors cadre, 4 mélanges violets (dont le bas
  rouge du générique) et 2 fins de scène qui bougent.

## Textes retirés de la vidéo 16:9

Ces textes ont été retirés pour alléger la lecture. Ils restent dans `config.json` pour la vidéo verticale et
l'affiche. **À reprendre à l'oral pendant la causerie et sur l'affiche** :

- Ouverture : le sous-titre « Les risques à ne pas prendre ».
- Accroche : les étiquettes « Bruyant » et « Très bruyant » sur le dessin.
- Seuils :
  - le titre « Les seuils de bruit » ;
  - « Valeurs sur 8 h de travail » ;
  - « En crête : 135 / 137 / 140 dB(C) ».
- Outils :
  - le titre « Ce qui abîme vos oreilles », remplacé par « Pas seulement les gros engins. » ;
  - la fin de la mention « Varie selon l'outil, le matériau et le lieu. » ;
  - la jauge et ses repères ;
  - les cartes **compresseur / groupe électrogène** et **aiguille vibrante**, qui n'ont pas de valeur sourcée.
- Oreilles : la légende de la courbe, « Votre audition ».
- Corps et sécurité :
  - le titre « La bonne organisation » ;
  - « = tout le monde se voit, tout le monde se comprend ».
- Réflexes :
  - carte 2 : « Rien entre coquille et oreille » ;
  - carte 3 : « pas seulement par moments ».

## Règles de contenu

- **Aucun chiffre inventé.** Seuls figurent les seuils réglementaires du Code du travail (art. R4431-2) repris par l'INRS :
  - 80 dB(A) et 135 dB(C) : valeurs d'exposition inférieures déclenchant l'action ;
  - 85 dB(A) et 137 dB(C) : valeurs supérieures ;
  - 87 dB(A) et 140 dB(C) : valeurs limites, atténuation du protecteur comprise.

  Ces valeurs portent sur 8 h de travail.
- **Niveaux des outils : seulement des valeurs sourcées.** Un chiffre n'apparaît que s'il figure dans `sources_bruit` avec sa `source` et sa `fiabilite` (voir plus bas). Sinon, la carte affiche « Bruyant ». Il s'agit d'ordres de grandeur, et la scène le rappelle. L'accroche (scène 1) reste qualitative : « Bruyant » ou « Très bruyant ».

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
- Tout texte fait **au moins 64 px en vertical**. En 16:9, il fait au moins **72 px pour un message principal**, 56 px pour un texte secondaire et 48 px partout ailleurs.
- Une ligne contient **6 mots au maximum**.
- Le rendu vérifie ces règles et le signale si un texte les enfreint.

## Modifier les textes ou traduire

Tous les textes sont dans [`config.json`](config.json), sous `textes.fr`. La vidéo 16:9 lit d'abord `textes.fr.h`, puis le reste de `textes.fr` pour les clés absentes. Un `\n` force un retour à la ligne. Les lignes trop longues sont réduites automatiquement, sans descendre sous le minimum.

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

## Niveaux de bruit des outils et sources

Les valeurs viennent **uniquement** de `sources_bruit` dans `config.json` :

```json
"show_db_values": true,
"sources_bruit": [
  { "id": "marteau_piqueur", "valeur": 110, "source": "…", "fiabilite": "moyenne" },
  { "id": "brise_roche", "valeur": [94, 100], "detail": "…", "source": "…", "fiabilite": "haute" }
]
```

Règles d'affichage :
- `valeur` est un nombre, ou une plage `[min, max]` affichée « ≈ 94 à 100 dB(A) ».
- Une entrée **sans `source` n'affiche aucun chiffre**.
- `"impulsionnel": true` ajoute le picto d'impulsion et la mention « Coup sec ».
- **`show_db_values: false`** masque tous les chiffres d'un coup : les repères de la jauge disparaissent et les cartes affichent « Très bruyant » ou « Bruyant ». Le liseré rouge et le panneau restent, puisqu'ils découlent des valeurs sourcées.

Les cartes sont définies dans `textes.fr.outils`, avec leur nom et leurs `sources`. La carte « Disqueuse, meuleuse » regroupe deux valeurs (94 et 100), d'où la plage.

**Sources utilisées :**

| Outil | Valeur affichée | Source | Fiabilité |
|---|---|---|---|
| Marteau-piqueur | ≈ 110 dB(A) | ASP Construction (Québec), échelle de décibels (données approximatives) | moyenne |
| Pistolet de scellement | ≈ 130 dB(A), impulsionnel | ASP Construction (Québec), échelle de décibels (données approximatives) | moyenne |
| Perforateur, burineur | ≈ 105 dB(A) | Exercice pédagogique de cours | faible |
| Scie à sol | ≈ 106 dB(A) | Exercice pédagogique de cours | faible |
| Disqueuse, meuleuse | ≈ 94 à 100 dB(A) (disqueuse 94, meuleuse 100) | Exercice pédagogique de cours | faible |
| Brise-roche hydraulique sur pelle | ≈ 94 à 100 dB(A) : 94 en moyenne sur 1 h, 100 derrière la pelle en burinage | INRS, fiche « Techniques de réduction du bruit » n°104 | haute |
| Compresseur, groupe électrogène | « Bruyant » (aucune valeur sourcée ; vertical et affiche seulement) | — | — |
| Aiguille vibrante | « Bruyant » (aucune valeur sourcée ; vertical et affiche seulement) | — | — |

Trois valeurs sur sept ont une fiabilité « faible » (exercice de cours). Remplacez-les par des mesures ou des sources publiées dès que possible, ou passez `show_db_values` à `false` en attendant.

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
npm run render -- --format horizontal   # vidéo 16:9 seule (le format actuellement demandé)
npm run render -- --format vertical     # vidéo 9:16 seule
npm run render -- --format affiche      # affiche A3 seule
npm run render                          # tous les formats
npm run stills -- 12,30.5 --format horizontal --scenes   # images clés + temps de chaque scène
npm run lisibilite                      # contrôle de lisibilité 16:9 (voir « Contrôles automatiques »)
npm run controle                        # contrôle d'anomalies 16:9
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
| `src/js/lib.js` | Textes multi-lignes, ajustement automatique, temps de lecture (`need`, `read`, `PAUSE`), motif hexagonal, transitions. |
| `src/js/pictos.js` | Panneau d'obligation (style ISO 7010), panneau de danger, pictogrammes SVG. |
| `src/js/scenes.js` | Les scènes de la vidéo verticale (et les dessins partagés : ouvrier, engin, ondes). |
| `src/js/scenes-h.js` | Les scènes de la vidéo 16:9, construites selon les règles de lecture. |
| `src/js/poster.js` | Mise en page de l'affiche A3. |
| `src/js/main.js` | Chargement, timeline unique `window.tl`, contrôles des textes, aperçu. |
| `scripts/render.mjs` | Rendu image par image, puis MP4 et affiche ; contrôles de lisibilité et d'anomalies. |
| `../outils-video/` | Contrôles partagés avec la vidéo sur les poussières (`lisibilite.js`, `controles.mjs`). |
| `scripts/dev.mjs` | Serveur de prévisualisation. |
| `output/` | Fichiers finaux (versionnés). |
