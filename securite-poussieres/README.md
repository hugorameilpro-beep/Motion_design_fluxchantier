# Poussières sur chantier : le masque dans les zones à risque

Vidéo de sensibilisation sécurité en motion design, **sans son**. Elle est faite pour être projetée lors de
l'accueil sécurité ou d'une causerie. Le message passe uniquement par l'image et des textes courts, pour des
compagnons et intérimaires parfois peu francophones.

| Livrable | Format | Fichier |
|---|---|---|
| Vidéo projection | 1920×1080 (16:9), 30 i/s, H.264, sans piste audio, 74,9 s | [`output/securite_poussieres_horizontal.mp4`](output/securite_poussieres_horizontal.mp4) |

Il n'existe pour l'instant ni version verticale ni affiche.

Le projet reprend la base technique de [`../securite-bruit/`](../securite-bruit/README.md) :
- même moteur GSAP, même police Inter embarquée, même palette Dumez ;
- même motif hexagonal et même rendu image par image ;
- pictogrammes et scènes propres aux poussières.

## Déroulé et temps de chaque scène

Les temps ci-dessous sont aussi affichés à la fin du rendu. Chaque durée inclut la transition vers la scène suivante.

| # | Scène | Début | Durée | Contenu |
|---|---|---|---|---|
| 0 | Ouverture | 0,0 s | 2,6 s | Logo Dumez sur fond blanc, titre, puis un hexagone bleu s'ouvre (vague d'hexagones). |
| 1 | Accroche | 2,6 s | 5,0 s | Chantier sombre : un rayon de lumière balaie l'image et révèle les poussières. « Les poussières les plus dangereuses… » puis, en rouge sur fond blanc, « …sont souvent invisibles. » |
| 2 | Zones à risque | 7,6 s | 7,8 s | Plan du chantier vu du dessus. Trois zones se balisent (ruban rouge et blanc) et se remplissent de poussière. À chaque entrée : panneau « Masque obligatoire » et niveau (FFP3). Un compagnon s'arrête au panneau, met son masque et entre. « Zone balisée = masque avant d'entrer. » |
| 3 | Ce qui lève la poussière | 15,5 s | 9,9 s | Huit cartes hexagonales (découpe de béton, carottage, perçage, ponçage, démolition, coupe à sec, ouverture des sacs, balayage et soufflette). « Pas seulement la démolition. » puis « Chaque tâche compte, chaque jour. » Mentions : exemples de tâches ; amiante, règles spécifiques. |
| 4 | La silice | 25,4 s | 7,8 s | « Béton, mortier, pierre, carrelage : ils contiennent de la silice. » Un grain très fin entre par le nez et descend jusqu'aux alvéoles, montrées en loupe. Mention de la valeur limite légale. |
| 5 | Conséquences | 33,2 s | 10,6 s | Les poumons se couvrent de zones rouges. Toux, bronchite chronique, silicose, essoufflement définitif. Puis plus grave : insuffisance respiratoire, cancer du poumon, parfois des années après. « Plus on en respire, plus le risque monte. » et « Le tabac aggrave les effets. » Message fort : « Des poumons abîmés ne se réparent pas. » |
| 6 | Réduire à la source | 43,8 s | 7,8 s | Trois cartes : l'eau, l'aspiration, l'organisation. « Le masque est la dernière barrière, pas la seule. » |
| 7 | Le bon masque | 51,6 s | 14,0 s | Cinq cartes : choisir (jetable FFP3, demi-masque P3, ventilation assistée), ajuster, mettre AVANT d'entrer, accessoires, hygiène. |
| 8 | Message final | 65,6 s | 5,0 s | « Zone à poussière : masque obligatoire. » puis « Vos poumons ne se remplacent pas. » Panneau bleu et logo Dumez. |
| 9 | Générique | 70,6 s | 4,2 s | Des particules convergent et dessinent l'hexagone du logo, pointe en haut, en bleu. Le bas passe au rouge, puis l'hexagone se pose sur celui du logo Dumez, qui apparaît. « Protégez vos poumons. », puis 1 s de maintien. |
| | **Total** | | **74,9 s** | |

## Règles de contenu

- **Aucun chiffre inventé.** Le seul chiffre affiché est la valeur limite d'exposition professionnelle (VLEP) de la silice cristalline : **0,1 mg/m³ sur 8 h pour le quartz** (Code du travail). La valeur de 0,05 mg/m³ pour la cristobalite et la tridymite n'est pas affichée.
- **Pas de pourcentage de filtration, pas de statistiques** de maladies ou de décès.
- **Amiante** : le sujet n'est pas traité. La scène des tâches mentionne démolition, dépose et ponçage, d'où la mention « Amiante : règles spécifiques, voir le responsable. ». Le drapeau `show_amiante_note` (activé par défaut) la contrôle.
- **Formulations sensibles** : elles sont regroupées dans `textes.fr.a_valider` et doivent être **validées par le responsable sécurité** avant diffusion. Ce sont :
  - le panneau « Masque obligatoire » ;
  - la règle « Zone balisée = masque avant d'entrer » ;
  - la phrase sur la silice des matériaux ;
  - la mention « FFP3 minimum pour la silice (à confirmer par le responsable sécurité) ».

  Le niveau de masque par zone se trouve dans `protection_par_zone`, qui porte le drapeau `"a_valider": true`.

## Identité visuelle et contrastes

La palette est la même que dans la vidéo sur le bruit, extraite du logo Dumez. **Aucune autre couleur n'est utilisée.**

| Rôle | Couleur |
|---|---|
| Bleu Dumez (dominant) | `#004489` |
| Bleu très foncé (fonds) | `#001F3D` |
| Rouge Dumez (danger, conséquences, alertes) | `#FA000C` |
| Blanc | `#FFFFFF` |

**Contrastes** (norme WCAG) :

| Texte | Fond | Contraste |
|---|---|---|
| Blanc | bleu foncé | 16,6:1 |
| Blanc | bleu | 9,6:1 |
| Blanc | rouge | 4,1:1 |
| Rouge | blanc | 4,1:1 |

Règles appliquées :
- Le blanc sur rouge et le rouge sur blanc sont réservés aux textes très gros et gras.
- **Aucun rouge n'est posé sur le bleu très foncé.** Dans les scènes sombres, le rouge n'apparaît qu'à l'intérieur d'éléments blancs : le panneau de l'accroche, les badges des tâches, la loupe sur les alvéoles.
- Les scènes qui ont besoin de rouge (plan balisé, poumons, messages forts) sont sur fond blanc.

**Typographie** : Inter, embarquée dans `assets/fonts/` (licence OFL).
- Tout texte fait **au moins 48 px**, avec **6 mots au maximum par ligne**. Un texte trop long est réduit automatiquement, sans jamais descendre sous 48 px.
- Le rendu vérifie la taille, le nombre de mots, la largeur et le débordement des cartes. Il affiche « textes : OK » ou la liste des problèmes.

**Logo Dumez** (`logos.entreprise`, chemin configurable) :
- il est affiché en ouverture, dans le message final et dans le générique, toujours sur fond blanc avec sa zone de protection (au moins la hauteur du « H ») ;
- il n'est ni recoloré ni déformé, et jamais agrandi au-delà de `agrandissement_max` (1,3 fois) ;
- le fichier actuel fait 421×120 px : une version HD améliorerait sa netteté.

Le crédit « Réalisé par Synapsis » est désactivé (`show_synapsis_credit: false`).

## Modifier les textes, `show_vlep`, ajouter une langue

Tous les textes sont dans [`config.json`](config.json), sous `textes.fr`. Un `\n` force un retour à la ligne.

| Réglage | Effet |
|---|---|
| `show_vlep` | `true` (par défaut) affiche « Valeur limite légale : 0,1 mg/m³ sur 8 h (quartz) » dans la scène sur la silice. `false` la masque. |
| `show_amiante_note` | `true` (par défaut) affiche la mention « Amiante : règles spécifiques… » dans la scène des tâches. |
| `protection_par_zone` | Niveau de masque par zone (`decoupe`, `poncage`, `demolition`) affiché sous chaque panneau, plus le niveau par défaut repris dans la carte « Choisissez le bon masque » (`{niveau}`). Exemple : `"niveau": "FFP2"`. |
| `textes.fr.a_valider` | Les formulations à faire valider : panneau, règle de zone, silice, mention FFP3. |
| `textes.fr.zones` | Noms des trois zones du plan. |
| `textes.fr.taches` | Les huit tâches. L'`id` choisit le pictogramme. |
| `textes.fr.masque_cartes` | Les cinq cartes du masque. |

**Ajouter une langue** (anglais, roumain, portugais…) :
1. Copiez le bloc `"fr": { … }` sous `textes` en le renommant, par exemple `"ro"`, puis traduisez les valeurs, y compris le bloc `a_valider`. Une clé absente reprend le texte français.
2. Générez la version : `npm run render -- --format horizontal --lang ro`. Le fichier obtenu est `output/securite_poussieres_horizontal_ro.mp4`.
3. Ou passez `"langue": "ro"` pour en faire la langue par défaut.

Gardez des lignes courtes : 6 mots au maximum.

## Installation, aperçu, génération

Il faut **Node.js 18 ou plus récent** et **ffmpeg**.

```bash
cd securite-poussieres
npm install                        # GSAP + Playwright 1.63.0 (aucune dépendance réseau au rendu)
npx playwright install chromium    # navigateur du rendu, une seule fois
```

ffmpeg :
- Linux : `sudo apt install ffmpeg`
- macOS : `brew install ffmpeg`
- Windows : `winget install ffmpeg`

```bash
npm run dev                                   # aperçu : http://localhost:5175/src/index.html?format=horizontal
npm run render -- --format horizontal         # génère output/securite_poussieres_horizontal.mp4
npm run stills -- 12,30.5 --format horizontal --scenes   # images clés dans frames/stills/ + temps des scènes
```

L'aperçu propose un curseur de timeline ; la touche Espace lance ou met en pause. Ajoutez à l'adresse :
- `&t=30` pour ouvrir à 30 s ;
- `&lang=ro` pour voir une traduction.

Le rendu est **déterministe**, sans enregistrement d'écran :
1. Playwright ouvre la page en 1920×1080.
2. Il avance l'unique timeline GSAP (`window.tl`) image par image, à 30 i/s, et capture chaque image en PNG.
3. ffmpeg assemble les images en MP4 H.264, sans piste audio.

Les images temporaires vont dans `frames/`, ignoré par git. La version de Playwright est figée à 1.63.0 pour correspondre au Chromium installé. Si vous mettez Playwright à jour, relancez `npx playwright install chromium`.

## Organisation

| Chemin | Rôle |
|---|---|
| `config.json` | Palette, logos, drapeaux, protection par zone et **tous les textes**. |
| `src/index.html` | Page unique (`?format=horizontal`, `&lang=`). |
| `src/styles.css` | Variables de couleur (remplies depuis `config.json`) et typographie. |
| `src/js/lib.js` | Textes masqués multi-lignes, ajustement automatique, motif hexagonal, transitions. |
| `src/js/pictos.js` | Panneau d'obligation « masque » (style ISO 7010), panneau de danger, pictogrammes au trait. |
| `src/js/scenes.js` | Les dix scènes et leur animation. |
| `src/js/main.js` | Chargement, timeline unique `window.tl`, contrôles des textes, aperçu. |
| `scripts/render.mjs` | Rendu image par image, MP4 et temps des scènes. |
| `output/` | Vidéo finale (versionnée). |

## Sources

À consulter et à faire valider par le responsable sécurité avant diffusion :

- **INRS : silice cristalline.** Dossier « Silice cristalline » sur inrs.fr : présence dans le béton, le mortier, la pierre et le carrelage ; effets (silicose, bronchite chronique, insuffisance respiratoire, cancer bronchique) ; prévention (réduction à la source par l'eau et l'aspiration, organisation).
- **INRS : protection respiratoire.** Brochure « Les appareils de protection respiratoire. Choix et utilisation » et dossier « Appareils de protection respiratoire » : choix FFP ou P3, ventilation assistée, ajustement et essai d'ajustement, barbe, durée de port, remplacement, notice.
- **Code du travail : valeurs limites.** Article R4412-149 : VLEP contraignantes sur 8 h, fraction alvéolaire, de **0,1 mg/m³ pour le quartz** et 0,05 mg/m³ pour la cristobalite et la tridymite. Seule la première est affichée.
- **Prévention BTP.** Documents OPPBTP (preventionbtp.fr) sur les poussières et la silice sur chantier : balisage des zones, travail à l'humide, outils avec aspiration, nettoyage sans balayage à sec ni soufflette, équipements de protection.

**Choix de formulation de la vidéo à valider** :
- le niveau FFP3 « minimum pour la silice » ;
- la règle « zone balisée = masque avant d'entrer » ;
- la liste des tâches et des matériaux.

Ces éléments dépendent de l'évaluation des risques et des consignes propres à chaque chantier.
