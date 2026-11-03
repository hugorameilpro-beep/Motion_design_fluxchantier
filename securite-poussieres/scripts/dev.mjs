// `npm run dev`: preview server with the timeline scrubber.
import { serve } from "./serve.mjs";

const port = Number(process.env.PORT || 5175);
await serve(port);
console.log(`Horizontal : http://localhost:${port}/src/index.html?format=horizontal`);
console.log("Espace = lecture/pause · curseur = navigation · &t=12.5 pour ouvrir à un instant · &lang=en pour une autre langue");
