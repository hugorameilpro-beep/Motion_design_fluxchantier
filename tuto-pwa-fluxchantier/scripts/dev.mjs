// `npm run dev`: preview server with the timeline scrubber.
import { serve } from "./serve.mjs";

const port = Number(process.env.PORT || 5173);
await serve(port);
console.log(`Aperçu Android : http://localhost:${port}/src/index.html?tuto=android`);
console.log(`Aperçu iPhone  : http://localhost:${port}/src/index.html?tuto=ios`);
console.log("Espace = lecture/pause · curseur = navigation · ?t=12.5 pour ouvrir à un instant précis");
