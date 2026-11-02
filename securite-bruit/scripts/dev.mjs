// `npm run dev`: preview server with the timeline scrubber.
import { serve } from "./serve.mjs";

const port = Number(process.env.PORT || 5174);
await serve(port);
console.log(`Vertical   : http://localhost:${port}/src/index.html?format=vertical`);
console.log(`Horizontal : http://localhost:${port}/src/index.html?format=horizontal`);
console.log(`Affiche A3 : http://localhost:${port}/src/index.html?format=affiche`);
console.log("Espace = lecture/pause · curseur = navigation · &t=12.5 pour ouvrir à un instant · &lang=en pour une autre langue");
