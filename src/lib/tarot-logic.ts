import { tarotCards, TarotCard } from "@/data/tarotData";

export type DrawnCard = {
  card: TarotCard;
  isReversed: boolean;
  positionName: string;
};

export type Language = "id" | "en";

export const SPREAD_CONFIGS = {
  1: {
    id: ["Fokus Utama (Insight)"],
    en: ["Insight"]
  },
  3: {
    id: ["Masa Lalu (Past)", "Masa Kini (Present)", "Masa Depan (Future)"],
    en: ["Past", "Present", "Future"]
  },
  6: {
    id: [
      "Masa Lalu (Past)", 
      "Masa Kini (Present)", 
      "Masa Depan (Future)", 
      "Penyebab Tersembunyi (Hidden Influences)", 
      "Saran / Aksi (Advice)", 
      "Hasil Akhir (Outcome)"
    ],
    en: [
      "Past", 
      "Present", 
      "Future", 
      "Hidden Influences", 
      "Advice", 
      "Outcome"
    ]
  }
};

export function drawCards(spreadSize: 1 | 3 | 6, language: Language = "id"): DrawnCard[] {
  const shuffled = [...tarotCards].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, spreadSize);
  
  const spreadNames = SPREAD_CONFIGS[spreadSize][language];
  
  return selected.map((card, index) => ({
    card,
    isReversed: Math.random() > 0.7, // 30% chance to be reversed
    positionName: spreadNames[index],
  }));
}

export function getCardMeaning(drawn: DrawnCard, language: Language = "id"): string {
  if (language === "id") {
    return drawn.isReversed 
      ? (drawn.card.descriptionReversedId || "Arti terbalik belum tersedia.")
      : (drawn.card.descriptionId || "Arti belum tersedia.");
  } else {
    return drawn.isReversed 
      ? (drawn.card.descriptionReversed || "Reversed meaning not available.")
      : (drawn.card.description);
  }
}
