import { NextRequest, NextResponse } from "next/server";
import { drawCards, getCardMeaning, Language } from "@/lib/tarot-logic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const spreadSize = parseInt(searchParams.get("spread") || "1") as 1 | 3 | 6;
  const lang = (searchParams.get("lang") || "id") as Language;

  if (![1, 3, 6].includes(spreadSize)) {
    return NextResponse.json({ error: "Invalid spread size. Use 1, 3, or 6." }, { status: 400 });
  }

  const cards = drawCards(spreadSize, lang);
  const result = cards.map(c => ({
    name: c.card.name,
    position: c.positionName,
    isReversed: c.isReversed,
    meaning: getCardMeaning(c, lang),
    image: `${req.nextUrl.origin}${c.card.image}`
  }));

  return NextResponse.json({
    spread: spreadSize,
    language: lang,
    cards: result
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const spreadSize = (body.spread || 1) as 1 | 3 | 6;
    const lang = (body.lang || "id") as Language;
    const fullName = body.fullName || "";
    const birthDate = body.birthDate || "";
    const story = body.story || "";

    if (![1, 3, 6].includes(spreadSize)) {
      return NextResponse.json({ error: "Invalid spread size. Use 1, 3, or 6." }, { status: 400 });
    }

    const cards = drawCards(spreadSize, lang);
    const cardsData = cards.map(c => ({
      name: c.card.name,
      position: c.positionName,
      isReversed: c.isReversed,
      meaning: getCardMeaning(c, lang),
      image: `${req.nextUrl.origin}${c.card.image}`
    }));

    // If story or names are provided, we could optionally call the summary logic here.
    // However, to keep the API clean, let's return the cards first.
    // If the user wants a summary, they can call /api/tarot-summary or we can integrate it.
    
    return NextResponse.json({
      status: "success",
      data: {
        user: {
          fullName,
          birthDate,
          story
        },
        reading: {
          spread: spreadSize,
          language: lang,
          cards: cardsData
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
