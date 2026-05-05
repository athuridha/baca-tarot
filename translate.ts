import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { tarotCards } from "./src/data/tarotData";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function translate() {
  console.log("Starting translation...");
  const newCards = [];
  
  for (let i = 0; i < tarotCards.length; i++) {
    const card = tarotCards[i];
    console.log(`Translating ${card.name} (${i + 1}/${tarotCards.length})...`);
    
    const prompt = `You are a Tarot expert.
Card Name: ${card.name}
Original Upright Description (English): ${card.description}

Task:
Provide a JSON object exactly with the following fields:
1. "descriptionId": Indonesian translation of the upright description. Make it mystical and empathetic.
2. "descriptionReversed": English meaning of the card when it is drawn in REVERSED position. Keep it concise, similar length to upright.
3. "descriptionReversedId": Indonesian translation of the reversed meaning.

Respond ONLY with valid JSON. Do not use markdown wrappers like \`\`\`json. Just the raw JSON object.`;

    try {
      const res = await fetch("https://ws-flbsagr9y3i48x1d.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer sk-a234381b5dd24cc8a119a799f5e9be6d",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [
            { role: "system", content: "You are a Tarot expert." },
            { role: "user", content: prompt }
          ]
        })
      });

      const jsonRes = await res.json();
      if (!jsonRes.choices) {
        throw new Error(JSON.stringify(jsonRes));
      }
      let text = jsonRes.choices[0].message.content.trim();
      if (text.startsWith('\`\`\`json')) {
         text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
      } else if (text.startsWith('\`\`\`')) {
         text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }
      
      const data = JSON.parse(text);
      
      newCards.push({
        ...card,
        descriptionId: data.descriptionId,
        descriptionReversed: data.descriptionReversed,
        descriptionReversedId: data.descriptionReversedId
      });
      
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error(`Error translating ${card.name}:`, err);
      newCards.push({
        ...card,
        descriptionId: "Maaf, arti belum tersedia.",
        descriptionReversed: "Sorry, reversed meaning not available.",
        descriptionReversedId: "Maaf, arti terbalik belum tersedia."
      });
    }
  }

  const output = `export interface TarotCard {
  name: string;
  description: string;
  descriptionId: string;
  descriptionReversed: string;
  descriptionReversedId: string;
  image: string;
}

export const tarotCards: TarotCard[] = ${JSON.stringify(newCards, null, 2)};
`;

  fs.writeFileSync("src/data/tarotData.ts", output);
  console.log("Done!");
}

translate();
