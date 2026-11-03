# Poussières sur chantier : le masque dans les zones à risque

Vidéo de sensibilisation sécurité en motion design, **sans son**. Elle est faite pour être projetée lors de
l'accueil sécurité ou d'une causerie. Elle est conçue pour des ouvriers qui lisent vite, de loin, et parfois
pas dans leur langue maternelle : **une idée par écran, peu de mots, chaque texte laissé le temps d'être lu.**

| Livrable | Format | Fichier |
|---|---|---|
| Vidéo projection | 1920×1080 (16:9), 30 i/s, H.264, sans piste audio, 143,3 s | [`output/securite_poussieres_horizontal.mp4`](output/securite_poussieres_horizontal.mp4) |

Il n'existe pour l'instant ni version verticale ni affiche.

Le projet reprend la base technique de [`../securite-bruit/`](../securite-bruit/README.md) : moteur GSAP, police Inter, palette Dumez, motif hexagonal et rendu image par image.

## Règles de lecture

Elles s'appliquent à toutes les scènes. Le contrôle automatique de lisibilité les vérifie à chaque rendu.

| Règle | Valeur |
|---|---|
| Idées par écran | Une seule. Au plus **3 blocs de texte** visibles en même temps, et au plus **10 mots** pour un message principal. |
| Temps de lecture minimum | Durée pendant laquelle un texte est entièrement visible et immobile : **max(2,5 s ; 0,5 s par mot + 1 s)**. Une étiquette d'icône reste au moins **2 s**. |
| Ordre d'apparition | Aucun nouveau texte n'apparaît pendant qu'on lit le précédent : les textes arrivent les uns après les autres. |
| Fin de scène | **0,5 s de pause fixe** avant la transition. |
| Taille du texte | **72 px** minimum pour les messages principaux, **56 px** pour les secondaires, 48 px partout ailleurs. |
| Petites mentions | Aucune à l'écran, à part la phrase courte sur l'amiante. Les autres sont reprises plus bas. |

Les durées ne sont pas fixées à la main. Chaque scène est construite texte après texte, et chaque temps de
lecture est **calculé à partir du nombre de mots** du texte de `config.json`. Une traduction plus longue rallonge
donc la scène automatiquement, au lieu d'être lue trop vite.

## Déroulé et temps de chaque scène

Les temps sont affichés à la fin du rendu. Chaque durée inclut la transition vers la scène suivante.

| # | Scène | Début | Durée | À l'écran |
|---|---|---|---|---|
| 0 | Ouverture | 0,0 s | 2,6 s | Logo Dumez seul, sur fond blanc, puis un hexagone bleu s'ouvre. |
| 1 | Accroche | 2,6 s | 8,2 s | Un rayon de lumière révèle les poussières. « Les poussières les plus dangereuses… » puis, en rouge sur blanc, « …sont souvent invisibles. » |
| 2 | Zones à risque | 10,8 s | 9,8 s | Plan avec trois zones balisées et un panneau « Masque » à chaque entrée. Un seul panneau est légendé « Masque obligatoire FFP3 ». Le compagnon marche lentement, met son masque, entre. Puis « Zone balisée = masque avant d'entrer. » |
| 3 | Ce qui lève la poussière | 20,6 s | 23,0 s | Six cartes : découpe de béton, perçage et burinage, ponçage, démolition, carrelage à sec, balayage à sec. Une étiquette à la fois, environ 2 s chacune ; les icônes restent. Puis « Pas seulement la démolition. » et « Amiante : voir le responsable. » |
| 4 | La silice | 43,6 s | 7,5 s | Une seule phrase : « Béton, mortier, pierre, carrelage : ils contiennent de la silice. » Un grain descend du nez jusqu'aux alvéoles. |
| 5 | Conséquences | 51,2 s | 19,2 s | Trois étapes, au moins 3 s chacune, pendant que les poumons rougissent : « Toux, irritations », « Silicose : poumons abîmés pour toujours », « Cancer du poumon, parfois des années après ». Puis « Des poumons abîmés ne se réparent pas. » |
| 6 | Réduire à la source | 70,4 s | 16,5 s | Trois cartes : « Découper à l'humide », « Outil avec aspirateur », « Alterner les tâches ». Puis, seul, le bandeau « Le masque est la dernière barrière, pas la seule. » |
| 7 | Le bon masque | 86,9 s | 40,5 s | Cinq cartes d'au moins 4,5 s : le bon masque (FFP3 pour la silice), bien l'ajuster, le mettre avant d'entrer, lunettes et combinaison, ne rien manger ni boire dans la zone. Puis « À retenir » en 3 points. |
| 8 | Message final | 127,3 s | 9,5 s | « Zone à poussière : masque obligatoire. » puis « Vos poumons ne se remplacent pas. » Panneau et logo Dumez. |
| 9 | Générique | 136,9 s | 6,4 s | Les poussières dessinent l'hexagone du logo, qui se pose sur le logo Dumez. « Protégez vos poumons. », puis 1 s de maintien. |
| | **Total** | | **143,3 s** | |

**Pourquoi 143 s et pas 95 s.** Avec les règles ci-dessus, les textes conservés demandent à eux seuls environ 130 s de lecture, à quoi s'ajoutent les transitions et les pauses :
- le bon masque, cinq cartes et le récapitulatif : environ 40 s ;
- les tâches : environ 23 s ;
- les conséquences : environ 19 s.

Comme demandé, les durées suivent les règles et non l'inverse. Pour se rapprocher de 95 s, il faut retirer du texte.

| Coupe possible | Gain |
|---|---|
| Récapitulatif « À retenir » | ≈ 12 s |
| Message final, puisque le générique le suit | ≈ 10 s |
| Tâches réduites de 6 à 4 cartes | ≈ 5 s |
| Une seule phrase d'accroche | ≈ 2 s |
| Bandeau « Le masque est la dernière barrière, pas la seule. » plus court | ≈ 1,5 s |

## Contrôle automatique de lisibilité

Le rendu commence par parcourir toute la timeline à 30 i/s. Pour chaque bloc de texte, ou chaque groupe lu ensemble (titre et ligne d'une même carte), il mesure :
- le **nombre de mots** ;
- le **temps pendant lequel le texte est entièrement visible et immobile** : lignes en place, opacité complète, aucune transition en cours ;
- la **durée minimale requise** par la règle.

Il affiche ensuite un tableau :

```
  Scène        Texte                                          Mots  Affiché  Requis   État
  Accroche     Les poussières les plus dangereuses…              5   6.97 s   3.5 s   OK
  Tâches       Découpe de béton                                  3   2.10 s   2.0 s   OK (étiquette)
  Masque       Le mettre avant d'entrer Le garder jusqu'à la…    9   5.63 s   5.5 s   OK
  …
  Au plus 3 blocs de texte visibles en même temps (maximum 3).
  Lisibilité : OK.
```

Le contrôle signale trois cas :
- un texte **trop court** ;
- un texte qui **apparaît pendant la lecture** d'un autre ;
- **plus de 3 blocs** visibles en même temps.

S'il trouve un problème, **le rendu s'arrête** avec un message clair. L'option `--no-strict` permet de rendre quand même.

```bash
npm run lisibilite                                          # contrôle seul, avec le temps des scènes
npm run stills -- 0 --format horizontal --lisibilite --images-lecture   # + une image au milieu de chaque lecture (frames/lecture/)
```

## Textes retirés de la vidéo

Ces textes sont retirés de l'écran pour alléger la lecture. **À reprendre à l'oral pendant la causerie et sur une future affiche** :

- « Valeur limite légale : 0,1 mg/m³ sur 8 h (quartz) ». Le texte reste dans `config.json` (`vlep`) et `show_vlep: true` le réaffiche, mais il allonge la scène sur la silice.
- « Exemples de tâches. Voir les consignes de votre chantier. »
- « FFP3 minimum pour la silice (à confirmer par le responsable sécurité) ». À l'écran, il ne reste que « FFP3 pour la silice », à faire valider.
- « Ordres de grandeur. »
- Tâches non montrées : **carottage**, **ouverture des sacs de ciment ou de plâtre**, **soufflette**.
- Conséquences : **bronchite chronique**, **insuffisance respiratoire**, « Plus on en respire, plus le risque monte. » et « Le tabac aggrave les effets. »
- Réduire à la source : « Pas de courant d'air » et « Ne jamais se placer entre la source de poussière et l'aspiration ».
- Bien ajuster : « Élastiques derrière la tête, pas aux oreilles » et « Faites un essai d'ajustement ».
- Hygiène : « Remplacer un masque jetable abîmé, humide ou difficile à respirer, et suivre la notice. »
- Amiante : la mention complète est « Amiante : règles spécifiques, voir le responsable ». La vidéo garde la version courte, « Amiante : voir le responsable. », lisible en 3 s.

## Règles de contenu

- **Aucun chiffre inventé.** La vidéo n'affiche aucune valeur chiffrée. La VLEP est désactivée par défaut, il n'y a pas de pourcentage de filtration, ni de statistiques de maladies ou de décès.
- **Amiante** : le sujet n'est pas traité, seule la mention courte apparaît (`show_amiante_note`, activé par défaut).
- **Formulations sensibles à valider par le responsable sécurité**, regroupées dans `textes.fr.a_valider` :
  - le panneau « Masque obligatoire » ;
  - la règle « Zone balisée = masque avant d'entrer » ;
  - la phrase sur la silice ;
  - « FFP3 pour la silice ».

  Le niveau par zone se trouve dans `protection_par_zone`, qui porte `"a_valider": true`.

## Identité visuelle et contrastes

La palette est celle du logo Dumez, et **aucune autre couleur** n'est utilisée :

| Rôle | Couleur |
|---|---|
| Bleu (dominant) | `#004489` |
| Bleu très foncé (fonds) | `#001F3D` |
| Rouge (danger, conséquences) | `#FA000C` |
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
- **Aucun rouge n'est posé sur le bleu très foncé.**

**Logo Dumez** :
- sur fond blanc, avec sa zone de protection ;
- jamais recoloré ni déformé, et au plus agrandi 1,3 fois (`logos.agrandissement_max`) ;
- une version HD du fichier améliorerait sa netteté.

Le crédit Synapsis est désactivé (`show_synapsis_credit: false`).

## Modifier les textes, `show_vlep`, ajouter une langue

Tous les textes sont dans [`config.json`](config.json), sous `textes.fr`. Un `\n` force un retour à la ligne : 6 mots au maximum par ligne.

| Réglage | Effet |
|---|---|
| `show_vlep` | `false` par défaut. `true` ajoute la valeur limite après la phrase sur la silice, et la scène s'allonge d'autant. |
| `show_amiante_note` | `true` par défaut : « Amiante : voir le responsable. » en fin de scène 3. |
| `protection_par_zone` | Niveau de masque par zone, affiché sur le panneau légendé, et niveau par défaut (`{niveau}`) repris dans « FFP3 pour la silice ». |
| `textes.fr.taches` | Les six tâches. L'`id` choisit le pictogramme. |
| `textes.fr.etapes` | Les trois étapes des conséquences. |
| `textes.fr.masque_cartes` | Les cinq cartes du masque : un `titre` et une `ligne`, lus ensemble. |
| `textes.fr.retenir` | Les trois points de « À retenir ». |

**Ajouter une langue** :
1. Copiez le bloc `"fr": { … }` sous `textes` en le renommant, par exemple `"ro"`, puis traduisez, y compris le bloc `a_valider`.
2. Lancez `npm run render -- --format horizontal --lang ro`.

Les durées s'adaptent toutes seules au nombre de mots, et le contrôle de lisibilité vérifie la traduction.

## Installation, aperçu, génération

Il faut **Node.js 18 ou plus récent** et **ffmpeg** :
- Linux : `sudo apt install ffmpeg`
- macOS : `brew install ffmpeg`
- Windows : `winget install ffmpeg`

```bash
cd securite-poussieres
npm install                          # GSAP + Playwright 1.63.0 (aucune dépendance réseau au rendu)
npx playwright install chromium      # navigateur du rendu, une seule fois
npm run dev                          # aperçu : http://localhost:5175/src/index.html?format=horizontal
npm run render -- --format horizontal   # contrôle de lisibilité, puis output/securite_poussieres_horizontal.mp4
```

Le rendu est **déterministe** :
1. Playwright ouvre la page en 1920×1080.
2. Il avance l'unique timeline GSAP (`window.tl`) image par image, à 30 i/s, et capture chaque image en PNG.
3. ffmpeg assemble le tout en MP4 H.264, sans piste audio.

Les images temporaires vont dans `frames/`, ignoré par git.

## Organisation

| Chemin | Rôle |
|---|---|
| `config.json` | Palette, logos, drapeaux, protection par zone et **tous les textes**. |
| `src/js/lib.js` | Textes, ajustement automatique avec planchers 72 / 56 / 48 px, **règles de lecture** (`words`, `need`, `read`), motif hexagonal. |
| `src/js/scenes.js` | Les dix scènes, enchaînées texte après texte. |
| `src/js/main.js` | Timeline unique `window.tl`, contrôles des textes, **contrôle de lisibilité** (`window.__readability`). |
| `src/js/pictos.js` | Panneau « masque » (style ISO 7010), panneau de danger, pictogrammes au trait. |
| `scripts/render.mjs` | Tableau de lisibilité, rendu image par image, MP4, temps des scènes. |

## Sources

À consulter et à faire valider par le responsable sécurité avant diffusion :

- **INRS : silice cristalline.** Dossier « Silice cristalline » sur inrs.fr :
  - présence dans le béton, le mortier, la pierre et le carrelage ;
  - effets : silicose, bronchite chronique, insuffisance respiratoire, cancer bronchique ;
  - prévention : réduction à la source par l'eau et l'aspiration, organisation.
- **INRS : protection respiratoire.** Brochure « Les appareils de protection respiratoire. Choix et utilisation » et dossier « Appareils de protection respiratoire » :
  - choix entre FFP et P3, ventilation assistée ;
  - ajustement et essai d'ajustement, barbe ;
  - durée de port, remplacement, notice.
- **Code du travail : valeurs limites.** Article R4412-149 : VLEP contraignantes sur 8 h, fraction alvéolaire, de 0,1 mg/m³ pour le quartz et de 0,05 mg/m³ pour la cristobalite et la tridymite. Elles ne sont pas affichées par défaut.
- **Prévention BTP.** Documents OPPBTP (preventionbtp.fr) sur les poussières et la silice :
  - balisage des zones, travail à l'humide, outils avec aspiration ;
  - nettoyage sans balayage à sec ni soufflette ;
  - équipements de protection.

Les points à valider (niveau FFP3, règle de zone, liste des tâches et des matériaux) dépendent de l'évaluation des risques et des consignes de chaque chantier.
