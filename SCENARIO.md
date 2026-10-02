# FluxChantier : scénario et script de la vidéo (15 s + signature Synapsis)

## Source : le vrai site

Tout le contenu de cette version vient de **https://fluxchantier.web.app**, inspecté le 2 octobre 2026.
Le site est une application Next.js rendue côté client. J'ai donc analysé son HTML, sa feuille de style,
son manifeste et ses bundles JavaScript (textes, composants, thème), et récupéré ses logos et sa police.

**Ce qu'est la plateforme :** « FluxChantier — Gestion des livraisons », plateforme de planification
et de réservation des créneaux de livraison de chantier. La version en ligne inspectée était configurée pour un chantier Dumez Île-de-France / VINCI ; la vidéo reprend le parcours avec la charte Synapsis-BTP (voir plus bas).

**La partie publique, c'est l'« Espace Sous-traitant ».** Il s'ouvre sans compte : seule l'équipe
chantier (conducteurs, gardien, direction) se connecte. Le parcours réel est le suivant :

1. **Accès :** on ouvre fluxchantier.web.app, ou on scanne l'affiche QR A4 du chantier
   (« 📱 Réservez votre créneau de livraison »). Une visite guidée est proposée
   (« 👋 Bienvenue sur FluxChantier… Suivez le guide en quelques étapes ! »).
2. **Planning :** « 🚚 Réserver une livraison — Cliquez sur un créneau libre. Les créneaux occupés sont
   anonymisés. » Il s'agit d'une grille hebdomadaire du lundi au vendredi, de 07h00 à 18h00, par pas de 30 min.
   Un créneau libre affiche « Créneau libre — réserver ». Il existe aussi un bouton « + Nouvelle demande ».
3. **Formulaire « 🚚 Nouvelle demande de livraison » :** Entreprise *, Email du demandeur *,
   Type de véhicule * (Camionnette, Camion, Camion 20m³, Semi-remorque, Porte-engins, Toupie béton, Autre),
   Provenance, Zone de déchargement *, Destination, Matériaux, Date *, Heure début *,
   Durée * (30 min / 1h / 2h), livreur, référent, gerbeur/chariot. La disponibilité est vérifiée en
   direct (« ✅ Créneau disponible. »). Il faut cocher les Mentions légales/CGU pour activer
   **« Confirmer la réservation »**.
4. **Après l'envoi :** le bandeau « ✅ Demande envoyée ! Un e-mail de confirmation vous a été adressé.
   L'équipe chantier va l'examiner et la valider. » apparaît, puis deux e-mails arrivent :
   - « Demande reçue ✅ », avec le statut « En attente de validation » ;
   - « Votre livraison est VALIDÉE ✅ », avec le lien « Annuler mon créneau » et la page
     **Accès chauffeur** (guidage GPS Waze / Google Maps, EPI, consignes d'accès, « 📡 Mon approche »).

## Charte graphique : Synapsis-BTP (thème sombre SaaS)

La vidéo n'utilise plus l'univers VINCI / Dumez. Elle applique la charte officielle de Synapsis-BTP.
Les écrans gardent la structure et les textes de FluxChantier, avec un habillage sombre :

| Rôle | Couleur |
|---|---|
| Fonds (scène, navigateur, champs) | **#0F172A** (Slate 900) |
| Cartes, conteneurs, en-tête de l'app | **#1E293B** (Slate 800), contours fins **#334155** |
| Couleur principale, boutons d'action | **#059669** → **#10B981** (dégradé émeraude) |
| Éléments actifs, curseur, points clés | **#34D399** (mots-clés, chiffres, focus, case cochée) et **#A3E635** (ondes de clic, balisage de la transition) |
| Titres | **#F8FAFC** |
| Textes secondaires, mentions | **#94A3B8** |
| Statut « En attente » | orange adouci pour fond sombre (`#FDBA74` sur `rgba(251,146,60,.14)`) : couleur de statut conservée pour la lisibilité |

- **Logo :** le camion vert officiel du thème Synapsis du site (`Logo_FluxChantier_Synapsis`, PNG
  transparent), sur une carte `#1E293B`. Dans l'en-tête de l'app, il est accompagné du symbole Synapsis.
- **Police :** Inter (celle du site) ; Montserrat pour la signature SYNAPSIS.
- **Mentions retirées :** le logo Dumez Île-de-France, « Dumez Île-de-France / VINCI » et le nom du
  chantier « THE CROSSING ». Ils sont remplacés par « Synapsis-BTP • Espace livraisons chantier »
  dans l'app et les e-mails, et par « Propulsé par Synapsis-BTP » à la fin du guide.

## Intention

**Objectif :** montrer en 15 secondes qu'un sous-traitant réserve un créneau de livraison
**en 3 étapes, sans compte**. Le spectateur doit retenir l'adresse **fluxchantier.web.app**, le
parcours **Créneau → Demande → Validation** et le message **simple, rapide, sans compte**.

**Ton :** énergique mais clair. Le montage suit la musique (128 BPM, une mesure = 1,875 s), sans voix off.

## Structure (8 mesures + 2 mesures de signature)

| Temps | Scène | Ce qu'on voit |
|---|---|---|
| 0,00 – 1,88 | **Ouverture** | Des traînées de vitesse émeraude, lime et blanches, comme celles du logo, traversent l'écran. La carte du logo apparaît et le camion y entre en dérapant. Onde de choc, puis le mot-symbole « FluxChantier » sort de derrière la pastille. Sous-titre : *Guide express · Espace Sous-traitant*. |
| 1,88 – 3,75 | **Promesse** | Le logo se range en haut à gauche. *ACCÈS PUBLIC · SANS COMPTE · SANS INSTALLATION*, puis un « 3 » géant en dégradé émeraude → lime qui frappe sur le temps fort, *étapes.*, et *pour réserver votre créneau de livraison.* |
| 3,36 – 4,20 | **Transition** | Volet émeraude, puis balisage lime et ardoise, puis dégradé émeraude. |
| 3,75 – 6,56 | **01 · Choisissez un créneau libre** | On tape *fluxchantier.web.app* et l'interface FluxChantier apparaît en thème sombre : en-tête avec logos, « Espace Sous-traitant », « 🔒 Espace Équipe Chantier ». Le planning « Lun. 5 oct. → Ven. 9 oct. » se charge, avec les créneaux occupés en ardoise « ⚪ Réservé ». La caméra zoome, le curseur survole mardi 08:30 (« Créneau libre — réserver ») et clique. |
| 6,56 – 9,38 | **02 · Remplissez la demande** | La fenêtre « 🚚 Nouvelle demande de livraison » s'ouvre, avec la date et l'heure du créneau déjà remplies. On saisit *BTP Martin* et *contact@btp-martin.fr*, on choisit *Semi-remorque* et *Cour intérieure*, puis « ✅ Créneau disponible. » s'affiche. On coche les CGU, le bouton émeraude s'active, on clique sur « Confirmer la réservation » et il affiche « Enregistrement… ». |
| 9,38 – 12,19 | **03 · Recevez la validation** | Le bandeau vert « ✅ Demande envoyée ! » apparaît et le créneau devient « Réservé » dans le planning. Un smartphone entre par le bas avec l'e-mail « Demande reçue ✅ » (🟠 En attente de validation). Le second e-mail arrive : « Votre livraison est VALIDÉE ✅ », le statut passe à 🟢 Validée, et le bouton « 🧭 Accès chauffeur — GPS & consignes » apparaît. |
| 12,19 – 13,36 | **Récapitulatif** | L'interface recule et se floute. Trois pastilles apparaissent : **1 Créneau → 2 Demande → 3 Validée**. |
| 13,36 – 15,00 | **Signature** | Les pastilles fusionnent, la pastille du logo apparaît et le camion y entre de nouveau. *fluxchantier.web.app* (le curseur clique dessus), **Simple. Rapide. Sans compte.**, puis *Propulsé par Synapsis-BTP*. |

| 15,00 – 18,75 | **Signature Synapsis** | Fondu vers un fond uni `#0F172A` en 0,45 s. Le symbole Synapsis apparaît au centre : échelle de 0,8 à 1,0 et fondu d'opacité (courbe *ease-out*). Juste après, **SYNAPSIS** (Montserrat ExtraBold, blanc) puis *synapsis-btp.fr* (vert menthe `#12D8A8` tiré du logo) montent légèrement en fondu. Le plan reste à l'écran environ 2,6 s, avec un très léger zoom. |

Pendant les étapes, un indicateur **1 Créneau – 2 Demande – 3 Validation** se remplit en bas à gauche.

## Script (textes à l'écran)

> **FluxChantier**
> Guide express · Espace Sous-traitant
>
> ACCÈS PUBLIC · SANS COMPTE · SANS INSTALLATION
> **3 étapes.** pour réserver votre créneau de livraison.
>
> **01. Choisissez un créneau libre**
> Ouvrez fluxchantier.web.app : le planning de la semaine s'affiche.
>
> **02. Remplissez la demande**
> Entreprise, e-mail, véhicule, zone : le créneau est vérifié en direct.
>
> **03. Recevez la validation**
> Confirmation par e-mail, puis validation par l'équipe chantier.
>
> 1 Créneau → 2 Demande → 3 Validée
>
> **FluxChantier**, fluxchantier.web.app
> Simple. Rapide. Sans compte.

## Fidélité et simplifications

- **Écrans :** l'en-tête, les libellés, les boutons, la grille, le formulaire, les messages et les e-mails
  reprennent la structure et le texte exacts du site, habillés aux couleurs Synapsis-BTP.
- **Données d'exemple :** le contenu du planning et du formulaire est fictif (*BTP Martin*, créneaux
  occupés, semaine du 5 octobre). Les champs facultatifs du formulaire (provenance, destination,
  matériaux, livreur, référent, gerbeur) ne sont pas montrés, pour tenir en 15 s.
- **Planning :** seules les lignes de 07:00 à 11:30 sont visibles. Sur le site, la grille va jusqu'à 18:00.
- **Délai de validation :** dans la réalité, la validation par l'équipe chantier n'est pas instantanée.
  La vidéo la condense, et le texte de l'étape 03 précise qu'elle vient de l'équipe chantier.

## Mouvement et son

Les principes ne changent pas par rapport à la première version :
- révélations de texte par masque ;
- caméra 3D qui zoome sur chaque action ;
- curseur qui suit les zooms, onde au clic ;
- continuité entre le logo d'ouverture, la signature et le logo final ;
- impacts amortis.

La musique est synthétisée (128 BPM, ré majeur). Chaque bruitage est calé sur `src/timeline.js` :
- frappe au clavier pour l'URL, l'entreprise et l'e-mail ;
- clics : créneau, champ, listes déroulantes, case CGU, bouton ;
- carillon à l'envoi ;
- notification à l'arrivée du premier e-mail ;
- carillon montant à la validation ;
- impacts sur le « 3 » et sur le logo.

Pendant la signature, la musique se pose sur deux mesures calmes (sol, puis ré), sans percussions,
avec un accord de cloches à l'apparition du logo et une note à chaque texte.

Niveau de sortie : environ -14 LUFS.

## Signature Synapsis : sources

- **Symbole :** l'image fournie (PNG sur fond blanc), détourée par programme dans
  `src/img/synapsis-mark.png`. Aucun SVG n'a été fourni : le message contenait encore le texte d'exemple.
- **Texte :** le logotype fourni étant une image, « SYNAPSIS » est recomposé en Montserrat ExtraBold,
  une police géométrique proche, en blanc pour la lisibilité sur fond sombre.
