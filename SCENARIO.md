# FluxChantier : scénario et script de la vidéo de 15 s

## Source : le vrai site

Tout le contenu de cette version vient de **https://fluxchantier.web.app**, inspecté le 2 octobre 2026.
Le site est une application Next.js rendue côté client. J'ai donc analysé son HTML, sa feuille de style,
son manifeste et ses bundles JavaScript (textes, composants, thème), et récupéré ses logos et sa police.

**Ce qu'est la plateforme :** « FluxChantier — Gestion des livraisons », plateforme de planification
et de réservation des créneaux de livraison du chantier **THE CROSSING** (Dumez Île-de-France / VINCI).

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

## Charte graphique relevée (thème « dumez » du site)

| Rôle | Valeur sur le site |
|---|---|
| Bleu de marque (en-tête, titres) | `brand-700` **#004589** (échelle complète `#EEF4FA` → `#002548`) |
| Accent (boutons d'action) | `accent` **#E30613**, survol `#C00510` |
| Couleur de thème (PWA) | **#0F172A** |
| Statuts | 🟠 En attente · 🟢 Validée · ⚪ Terminée · 🔴 Refusée (tons orange, emerald, slate, red de Tailwind) |
| Police | **Inter** (police variable 100–900 servie par le site, reprise telle quelle) |
| Logo | Camion de livraison en dégradé bleu → rouge (`Logo_FluxChantier_DUMEZ`), affiché sur une pastille blanche dans l'en-tête, à côté du logo Dumez Île-de-France |

Dans la vidéo, ces couleurs sont reprises telles quelles. Le fond est un bleu nuit tiré de l'échelle
`brand-800` / `brand-900`, et les transitions utilisent le balisage de chantier rouge et blanc.

## Intention

**Objectif :** montrer en 15 secondes qu'un sous-traitant réserve un créneau de livraison
**en 3 étapes, sans compte**. Le spectateur doit retenir l'adresse **fluxchantier.web.app**, le
parcours **Créneau → Demande → Validation** et le message **simple, rapide, sans compte**.

**Ton :** énergique mais clair. Le montage suit la musique (128 BPM, une mesure = 1,875 s), sans voix off.

## Structure (8 mesures)

| Temps | Scène | Ce qu'on voit |
|---|---|---|
| 0,00 – 1,88 | **Ouverture** | Des traînées de vitesse bleues et rouges, comme celles du logo, traversent l'écran. La pastille blanche de l'en-tête apparaît et le camion y entre en dérapant. Onde de choc, puis le mot-symbole « FluxChantier » sort de derrière la pastille. Sous-titre : *Guide express · Espace Sous-traitant*. |
| 1,88 – 3,75 | **Promesse** | Le logo se range en haut à gauche. *ACCÈS PUBLIC · SANS COMPTE · SANS INSTALLATION*, puis un « 3 » rouge géant qui frappe sur le temps fort, *étapes.*, et *pour réserver votre créneau de livraison.* |
| 3,36 – 4,20 | **Transition** | Volet bleu Dumez, puis balisage rouge et blanc, puis rouge accent. |
| 3,75 – 6,56 | **01 · Choisissez un créneau libre** | On tape *fluxchantier.web.app* et l'interface réelle apparaît : en-tête bleu avec logos, « Espace Sous-traitant », « 🔒 Espace Équipe Chantier ». Le planning « Lun. 5 oct. → Ven. 9 oct. » se charge, avec les créneaux occupés en gris « ⚪ Réservé ». La caméra zoome, le curseur survole mardi 08:30 (« Créneau libre — réserver ») et clique. |
| 6,56 – 9,38 | **02 · Remplissez la demande** | La fenêtre « 🚚 Nouvelle demande de livraison » s'ouvre, avec la date et l'heure du créneau déjà remplies. On saisit *BTP Martin* et *contact@btp-martin.fr*, on choisit *Semi-remorque* et *Cour intérieure*, puis « ✅ Créneau disponible. » s'affiche. On coche les CGU, le bouton rouge s'active, on clique sur « Confirmer la réservation » et il affiche « Enregistrement… ». |
| 9,38 – 12,19 | **03 · Recevez la validation** | Le bandeau vert « ✅ Demande envoyée ! » apparaît et le créneau devient « Réservé » dans le planning. Un smartphone entre par le bas avec l'e-mail « Demande reçue ✅ » (🟠 En attente de validation). Le second e-mail arrive : « Votre livraison est VALIDÉE ✅ », le statut passe à 🟢 Validée, et le bouton « 🧭 Accès chauffeur — GPS & consignes » apparaît. |
| 12,19 – 13,36 | **Récapitulatif** | L'interface recule et se floute. Trois pastilles apparaissent : **1 Créneau → 2 Demande → 3 Validée**. |
| 13,36 – 15,00 | **Signature** | Les pastilles fusionnent, la pastille du logo apparaît et le camion y entre de nouveau. *fluxchantier.web.app* (le curseur clique dessus), **Simple. Rapide. Sans compte.**, puis *Chantier THE CROSSING · Dumez Île-de-France / VINCI*. |

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
  reprennent le texte et les styles exacts du site (classes Tailwind traduites en CSS).
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

Niveau de sortie : environ -14 LUFS.
