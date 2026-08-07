import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const INPUT_FILE = "schools-list.json";
const OUTPUT_FILE = "schools-with-region.json";

const BATCH_SIZE = 300;

const MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash"
];

let currentModel = 0;

const schools = JSON.parse(
  fs.readFileSync(INPUT_FILE, "utf8")
);

let result = [];

if (fs.existsSync(OUTPUT_FILE)) {
  result = JSON.parse(
    fs.readFileSync(OUTPUT_FILE, "utf8")
  );
}

let start = result.length;

console.log(`Reprise à ${start}/${schools.length}`);

const sleep = (ms) =>
  new Promise((r) => setTimeout(r, ms));

async function processBatch(batch) {

  while (true) {

    const model = MODELS[currentModel];

    console.log("Modèle :", model);

    const prompt = `
Tu es un expert de la géographie administrative du Maroc.

Détermine la région officielle de CHAQUE école.

Utilise :

- school_name
- city
- address

city peut être :
- une commune
- une ville
- un quartier
- un arrondissement

Utilise toujours l'adresse lorsqu'elle est utile.

Les seules régions possibles sont :

- Tanger-Tétouan-Al Hoceïma
- L'Oriental
- Fès-Meknès
- Rabat-Salé-Kénitra
- Béni Mellal-Khénifra
- Casablanca-Settat
- Marrakech-Safi
- Drâa-Tafilalet
- Souss-Massa
- Guelmim-Oued Noun
- Laâyoune-Sakia El Hamra
- Dakhla-Oued Ed-Dahab

Réponds UNIQUEMENT par un tableau JSON.

${JSON.stringify(batch)}
`;

    try {

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      let txt = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(txt);

    } catch (e) {

      const msg = e.message;

      console.log(msg);

      //------------------------------------------------------
      // quota
      //------------------------------------------------------

      if (
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("Quota")
      ) {

        console.log("Quota atteint.");

        if (currentModel < MODELS.length - 1) {

          currentModel++;

          console.log(
            "Changement vers",
            MODELS[currentModel]
          );

          continue;

        }

        console.log(
          "Tous les modèles sont saturés."
        );

        console.log(
          "Attente 60 secondes..."
        );

        await sleep(60000);

        currentModel = 0;

        continue;

      }

      //------------------------------------------------------
      // modèle supprimé
      //------------------------------------------------------

      if (
        msg.includes("404") ||
        msg.includes("NOT_FOUND") ||
        msg.includes("no longer available")
      ) {

        console.log(
          "Modèle indisponible."
        );

        if (currentModel < MODELS.length - 1) {

          currentModel++;

          continue;

        }

        throw e;

      }

      //------------------------------------------------------
      // autre erreur
      //------------------------------------------------------

      console.log(
        "Erreur inconnue."
      );

      console.log(
        "Nouvelle tentative dans 20 secondes..."
      );

      await sleep(20000);

    }

  }

}

(async () => {

  for (
    let i = start;
    i < schools.length;
    i += BATCH_SIZE
  ) {

    console.log(
      `\n${i + 1} -> ${Math.min(
        i + BATCH_SIZE,
        schools.length
      )}`
    );

    const batch = schools.slice(
      i,
      i + BATCH_SIZE
    );

    const regions = await processBatch(batch);

    if (regions.length !== batch.length) {

      console.log(
        "Nombre de réponses incorrect."
      );

      break;

    }

    batch.forEach((school, index) => {

      result.push({
        ...school,
        region: regions[index].region,
      });

    });

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(result, null, 2),
      "utf8"
    );

    console.log(
      `Sauvegardé : ${result.length}/${schools.length}`
    );

  }

  console.log("🎉 TERMINÉ");

})();