import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { story, fullName, birthDate, cards, spreadSize, language } = await req.json();

    const isEn = language === "en";

    const userInfoEn = [
      fullName ? `Name: ${fullName}` : null,
      birthDate ? `Date of Birth: ${birthDate}` : null,
      story ? `Story: "${story}"` : null
    ].filter(Boolean).join("\n");

    const userInfoId = [
      fullName ? `Nama: ${fullName}` : null,
      birthDate ? `Tanggal Lahir: ${birthDate}` : null,
      story ? `Cerita: "${story}"` : null
    ].filter(Boolean).join("\n");

    const cardsDesc = cards.map((c: any) => `- ${isEn ? "Position" : "Posisi"}: ${c.positionName}\n- ${isEn ? "Card" : "Kartu"}: ${c.card.name} ${c.isReversed ? (isEn ? "(Reversed)" : "(Terbalik/Reversed)") : (isEn ? "(Upright)" : "(Tegak/Upright)")}\n- ${isEn ? "Meaning" : "Arti Dasar"}: ${c.isReversed ? (isEn ? (c.card.descriptionReversed || "No meaning") : (c.card.descriptionReversedId || c.card.descriptionReversed || c.card.description)) : (isEn ? (c.card.description || "No meaning") : (c.card.descriptionId || c.card.description))}`).join("\n\n");

    const prompt = isEn ? `
You are a mystical, empathetic, and highly intuitive Tarot reader.
User's details and current situation:
${userInfoEn || 'No specific question, just seeking general guidance.'}

They have drawn ${spreadSize} Tarot cards:
${cardsDesc}

Writing Style Rules (CRITICAL):
1. **Personalization:** If a name is provided, address the user by their name. If a birthdate is provided, you may subtly connect their astrological energy to the reading.
2. **Short & Punchy:** Do not write long, boring walls of text. Keep it concise. Max 3-4 short sentences per section. 
3. **Mystical yet Direct:** Use an elegant, slightly mysterious tone, but cut straight to the point. Make the user feel "read" and understood.
4. **Synthesis over Theory:** Do NOT explain the basic textbook meaning of the cards (the user already read that). Combine their energies and immediately apply them to the user's specific story and profile.
5. **Formatting:** Use short paragraphs, bold texts for emphasis, and bullet points. 

Required Output Structure:
- **The Universe's Whisper (1 short paragraph):** A mystical, warm opening that directly addresses their core issue and mentions their name if provided.
- **The Red Thread (Short bullet points):** The synthesized meaning of how the cards connect to their specific situation.
- **To-The-Point Action / Insight:** 2-3 extremely direct, actionable bullet points they should do or reflect on today.
` : `
Kamu adalah seorang pembaca Tarot yang mistis, empatik, dan berintuisi tinggi.
Detail dan kondisi User saat ini:
${userInfoId || 'Tidak ada pertanyaan spesifik, hanya meminta pencerahan umum.'}

Mereka telah menarik ${spreadSize} kartu Tarot:
${cardsDesc}

Aturan Gaya Penulisan (SANGAT PENTING):
1. **Personalisasi:** Jika ada nama, sapa user dengan nama mereka. Jika ada tanggal lahir, kaitkan sedikit energi astrologi mereka ke dalam bacaan jika relevan.
2. **Singkat & Padat:** Jangan menulis paragraf panjang yang membosankan. Buat sangat ringkas dan to-the-point. Maksimal 3-4 kalimat per bagian.
3. **Mistis tapi Menohok:** Gunakan nada bicara yang elegan dan misterius, tapi langsung tembak ke inti masalah. Buat user merasa "terbaca" hatinya.
4. **Sintesis, Bukan Teori:** JANGAN jelaskan lagi arti dasar kartunya (user sudah membaca itu). Langsung gabungkan energi kartu-kartu tersebut dan kaitkan secara spesifik dengan cerita serta profil user.
5. **Pemformatan Rapi:** Gunakan paragraf pendek, teks tebal (bold) untuk penekanan, dan bullet points.

Struktur Jawaban yang Wajib Diikuti:
- **Bisikan Semesta (1 paragraf pendek):** Pembuka yang mistis, hangat, dan langsung menyentuh akar masalah user serta menyebut nama mereka jika tersedia.
- **Benang Merah (Bullet points singkat):** Inti dari kombinasi kartu dan kaitannya dengan situasi user saat ini.
- **Kesimpulan / Aksi To-The-Point:** 2-3 poin tindakan nyata atau mindset yang harus diambil user mulai hari ini. Jangan bertele-tele.
`;

    // Try Alibaba Cloud (Qwen) First
    try {
      if (process.env.ALIBABA_API_KEY) {
        const baseUrl = process.env.ALIBABA_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
        const alibabaRes = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.ALIBABA_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [
              {
                role: "system",
                content: "Kamu adalah pembaca tarot mistis."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        if (alibabaRes.ok) {
          const alibabaData = await alibabaRes.json();
          return NextResponse.json({ summary: alibabaData.choices[0].message.content });
        } else {
          console.warn("Alibaba Cloud response failed, falling back to Gemini:", await alibabaRes.text());
        }
      }
    } catch (e) {
      console.warn("Alibaba Cloud error, falling back to Gemini:", e);
    }

    // Fallback to Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ summary: "Konfigurasi API belum lengkap. Silakan cek .env.local" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ summary: response.text });
  } catch (error) {
    console.error("Tarot summary error:", error);
    return NextResponse.json(
      { error: "Gagal membuat summary dari kartu." },
      { status: 500 }
    );
  }
}
