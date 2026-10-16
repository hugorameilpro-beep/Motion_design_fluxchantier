# VigiChantier : scénario et script de la vidéo (15 s + signature Synapsis)

## Source : le vrai site

Le contenu vient de **https://vigichantier.web.app**, inspecté le 16 octobre 2026. J'ai analysé
le HTML, les styles, le code JavaScript de l'application (modules, seuils, règles de décision,
tutoriel intégré), le manifeste et les icônes.

**Ce qu'est l'application :** « VigiChantier — Module de Prévention Météo & Pilotage Chantier ».
C'est une PWA d'aide à la décision météo pour le BTP, avec des données Open-Meteo et Météo-France et
des notifications push directes ou Telegram.

**Accès :** il n'y a pas de partie publique. Le tableau de bord demande une connexion Google
avec un compte autorisé ; la ronde est accessible aux gardiens avec un code PIN, pour une session de 12 h.
La vidéo est donc une **présentation des fonctions clés**, et non un tutoriel d'accès.

**Fonctions relevées sur le site :**

| Module | Ce qu'il fait (d'après le site) |
|---|---|
| ☔ **VigiPluie** | Surveillance temps réel et bilan nocturne. Statuts : 🟢 Aucun risque · 🟡 Pluie légère · 🔴 Averse imminente · 🌙 Nuit… Réglages : seuil FORT (mm/h), horizon d'anticipation (ex. 30 min), rappel anti-spam. |
| ☀️ **VigiChaleur** | Température actuelle, pic prévu (07h→19h), UV max ; alerte le matin si le pic dépasse le seuil. |
| 🌬️ **VigiVent** | Rafales actuelles et pic du jour (08h→18h) ; anticipation du grutage. |
| 🧊 **VigiGel** | Alerte si la température actuelle ou prévue dans les 2 h passe sous le seuil. |
| 🚦 **Décision par tâche** | Verdict **GO / VIGILANCE / NO-GO** sur 24 h, heure par heure, pour les tâches sensibles : étanchéité / toiture-terrasse, manutention CVC / levage (grue mobile), façade vitrée / menuiseries ext., peintures ext. / ragréages / résines. Le détail des « créneaux bloquants » est consultable. |
| 🛰️ **Radar de pluie**, graphique d'intensité | Précipitations autour du chantier ; courbe des mesures avec le seuil FORT en pointillés. |
| 🚪 **Ronde des ouvrants** | Vérification des fermetures avant intempéries sur un plan interactif par niveau, par scan NFC ou QR. Statuts : Non vérifié, Sécurisé / fermé, Anomalie. Fin de ronde : « Chantier 100 % Sécurisé ! », plus un registre d'assurance horodaté. |
| 📢 **Canal Direct** | Journal officiel du chantier : alertes, clôtures de ronde, consignes. |
| 📄 **Attestation intempéries** | Relevé horodaté des dépassements de seuils en PDF (CIBTP / MOE). |

## Charte

La vidéo garde la **palette Synapsis-BTP sombre** utilisée pour FluxChantier : fond `#0F172A`,
cartes `#1E293B` bordées de `#334155`, actions `#059669` → `#10B981`, accents `#34D399` / `#A3E635`,
titres `#F8FAFC`, textes secondaires `#94A3B8`.

- **Exception assumée :** les verdicts et les risques gardent leur code couleur, adouci pour le fond
  sombre (VIGILANCE en ambre, NO-GO et « Averse imminente » en rouge corail), car c'est l'information elle-même.
- **Logo :** le symbole « forme fluide » de VigiChantier. Je l'ai repris du tracé vectoriel servi par le
  site (`/icons/mask-icon.svg`), avec le dégradé vert de votre logo ; il reste net à toutes les tailles.
  Il apparaît en balayage de gauche à droite, comme dans la vidéo d'intro du site.
- **Thème du site :** le thème « Synapsis » de l'application est clair (vert forêt `#1B6B4A`) ; la
  vidéo applique la version sombre demandée. Le logo Dumez présent dans le code du site n'est pas repris.

## Structure (8 mesures à 128 BPM + 2 mesures de signature)

| Temps | Scène | Ce qu'on voit |
|---|---|---|
| 0,00 – 1,88 | **Ouverture** | Pluie fine en fond. Le symbole VigiChantier apparaît en balayage de gauche à droite, onde de choc, puis le mot-symbole **Vigi**Chantier sort de derrière. Sous-titre : *Prévention météo · Pilotage chantier*. |
| 1,88 – 3,75 | **Promesse** | *LA MÉTÉO DU CHANTIER · ANTICIPÉE*. Quatre tuiles tombent sur les temps : ☔ Pluie, ☀️ Chaleur, 🌬️ Vent, 🧊 Gel (VigiPluie, VigiChaleur, VigiVent, VigiGel). *Alertes en temps réel, sur le téléphone de l'équipe.* |
| 3,36 – 4,20 | **Transition** | Volet émeraude, balisage lime et ardoise, dégradé émeraude. |
| 3,75 – 6,56 | **01 · Surveillez en temps réel** | On tape *vigichantier.web.app* ; le tableau de bord apparaît : bandeau, onglets, cartes VigiPluie, VigiChaleur et VigiVent. La courbe d'intensité monte et franchit le seuil FORT en pointillés. Au même instant, VigiPluie passe de 🟢 *Aucun risque* à 🔴 *Averse imminente* (3,20 mm/h) et la caméra zoome sur la carte. |
| 6,56 – 9,38 | **02 · Décidez tâche par tâche** | Défilement jusqu'à « 🚦 Décision par tâche — 24 h à venir ». Les verdicts tombent sur les temps : étanchéité 🔴 NO-GO, levage 🟠 VIGILANCE, façade vitrée 🔴 NO-GO ; « Peintures ext. » est désactivée dans *Mes tâches actives*. Clic sur « Voir les créneaux bloquants » : *🔴 NO-GO : 13h-16h · 🟠 Vigilance : 12h, 17h*. |
| 9,38 – 12,19 | **03 · Alertez, puis sécurisez** | La pluie s'intensifie. Un téléphone reçoit la notification « ☔ VigiPluie — Averse imminente ». Clic sur l'onglet 🚪 Ronde Ouvrants : le plan du niveau R+1 s'affiche et, à chaque scan NFC sur le téléphone, un ouvrant passe au vert (*Global : 1 / 8 → 8 / 8*). Fin : « 🛡️ Chantier 100 % Sécurisé ! — 8 ouvrants validés · 13:41 ». |
| 12,19 – 13,36 | **Récapitulatif** | 📊 Surveiller → 🚦 Décider → 🛡️ Sécuriser. |
| 13,36 – 15,00 | **Fin du guide** | Le logo se reforme ; *vigichantier.web.app* (clic), **Anticipez. Décidez. Sécurisez.**, puis *Alertes push & Telegram · Attestation intempéries PDF · Registre horodaté*. |
| 15,00 – 18,75 | **Signature Synapsis** | Identique à FluxChantier : fondu vers `#0F172A`, symbole Synapsis (échelle 0,8 → 1 et fondu), puis SYNAPSIS et synapsis-btp.fr. |

## Script (textes à l'écran)

> **VigiChantier** — Prévention météo · Pilotage chantier
>
> LA MÉTÉO DU CHANTIER · ANTICIPÉE — Pluie · Chaleur · Vent · Gel
> Alertes en temps réel, sur le téléphone de l'équipe.
>
> **01. Surveillez en temps réel** — Pluie, chaleur, vent : chaque module affiche le risque du moment.
> **02. Décidez tâche par tâche** — GO, VIGILANCE ou NO-GO, heure par heure, sur 24 h.
> **03. Alertez, puis sécurisez** — Alerte push à l'équipe, puis ronde des ouvrants en NFC / QR.
>
> 1 Surveiller → 2 Décider → 3 Sécuriser
>
> **VigiChantier** — vigichantier.web.app — Anticipez. Décidez. Sécurisez.

## Fidélité et simplifications

- **Écrans :** le bandeau, les onglets, les cartes, le graphique, le widget de décision, la ronde
  et l'écran de fin de ronde reprennent la structure et les libellés exacts du site, habillés aux couleurs Synapsis.
- **Données d'exemple :** les valeurs météo, les heures, le plan du niveau et les noms d'ouvrants
  sont fictifs. Ils restent cohérents avec les règles réelles de l'application : NO-GO étanchéité si
  pluie > 0,2 mm/h ou rafales > 40 km/h ; VIGILANCE levage entre 45 et 60 km/h ; NO-GO façade si
  rafales > 40 km/h ou pluie ≥ 0,5 mm/h.
- **Notification :** le texte exact des alertes est généré côté serveur et n'est pas visible sur le
  site. Le message montré, « 3,2 mm/h attendus d'ici 30 min : abritez le matériel et lancez la ronde. »,
  est une illustration fondée sur l'horizon d'anticipation et les consignes du site.
- **Durée :** la ronde de 8 ouvrants est condensée en environ 1 seconde.

## Son

Même base musicale que FluxChantier (128 BPM, ré majeur, synthétisée, sans droits). S'y ajoutent :
- une ambiance de pluie qui suit l'intensité à l'écran ;
- des notes sur les quatre tuiles météo ;
- un bip d'avertissement quand VigiPluie passe en averse ;
- des notes sur chaque verdict ;
- un signal d'alerte en deux tons à la notification ;
- un bip à chaque scan NFC ;
- un carillon montant pour « Chantier 100 % Sécurisé ! » ;
- la signature Synapsis.
