# Motion design FluxChantier : guide de la partie publique (15 s)

![Storyboard](out/storyboard.jpg)

**Vidéo finale :** [`out/fluxchantier_motion_15s.mp4`](out/fluxchantier_motion_15s.mp4)
(1920×1080, 60 i/s, H.264 + AAC, 15,0 s, environ 7 Mo)

Scénario, script, principes de mouvement et sound design : voir [`SCENARIO.md`](SCENARIO.md).

## Le parcours expliqué

1. **Choisissez votre chantier** : ouvrez *fluxchantier.web.app* et sélectionnez votre site.
2. **Réservez votre créneau** : date, heure, véhicule.
3. **Validez, c'est confirmé** : le pass d'accès arrive instantanément sur mobile.

## Comment c'est fabriqué

Tout est du code, donc modifiable et reproductible. Aucune vidéo ni image de banque n'est utilisée.

| Fichier | Rôle |
|---|---|
| `src/index.html` | Décor, interface simulée, logo. Les **variables de la charte** sont dans `:root`. |
| `src/anim.js` | Moteur d'animation : `seek(t)` place chaque élément à l'instant `t` (courbes d'accélération, images clés, caméra 3D, curseur). |
| `src/timeline.js` | Instants clés partagés par l'image **et** le son (clics, frappes, impacts…). |
| `scripts/render.mjs` | Capture image par image avec Chromium headless (Playwright), en parallèle. |
| `scripts/audio.py` | Synthèse de la musique (128 BPM) et des bruitages (numpy). |
| `scripts/build.sh` | Enchaîne tout : son → images → MP4, plus l'affiche et le storyboard. |

### Régénérer la vidéo

```bash
npm install            # playwright
pip install numpy
npm run build          # -> out/fluxchantier_motion_15s.mp4
```

- Aperçu en temps réel dans le navigateur : `npm run preview`, puis ouvrir http://localhost:8080
  (`?t=7.5` fige l'image à 7,5 s).
- Images fixes de contrôle : `npm run stills -- 2.5,7.5,14.6` (enregistrées dans `build/stills/`).
- Re-rendu partiel : `FROM=12 TO=13.5 node scripts/render.mjs`, puis `SKIP_FRAMES=1 npm run build`.

### Adapter à la charte réelle

Le site n'était pas joignable depuis l'environnement de production. Les couleurs, le logo et
les écrans sont donc une interprétation. Pour les recaler sur la vraie interface :

- couleurs : variables CSS `:root` dans `src/index.html` ;
- logo : symbole `#i-mark` et `#logoMark` ;
- textes et écrans : balisage de `src/index.html` (pages `#pageA`, `#pageB`, `#pageC`).
