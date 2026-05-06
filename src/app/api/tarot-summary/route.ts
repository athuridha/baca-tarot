import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function getLifePathNumber(dateStr: string): number | null {
  if (!dateStr) return null;
  const digits = dateStr.replace(/\D/g, '');
  if (digits.length < 8) return null;
  let sum = digits.split('').reduce((a, b) => a + parseInt(b), 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return sum;
}

function getNameNumerology(name: string): number | null {
  if (!name) return null;
  const map: Record<string, number> = {
    A:1, J:1, S:1, B:2, K:2, T:2, C:3, L:3, U:3,
    D:4, M:4, V:4, E:5, N:5, W:5, F:6, O:6, X:6,
    G:7, P:7, Y:7, H:8, Q:8, Z:8, I:9, R:9
  };
  const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanName) return null;
  let sum = cleanName.split('').reduce((acc, char) => acc + (map[char] || 0), 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return sum;
}

export async function POST(req: NextRequest) {
  try {
    const { story, fullName, birthDate, cards, spreadSize, language, theme } = await req.json();

    const isEn = language === "en";

    const themeLabels: Record<string, { en: string; id: string }> = {
      love: { en: "Love & Romance", id: "Asmara & Cinta" },
      career: { en: "Career & Finance", id: "Karier & Keuangan" },
      spirit: { en: "Mind, Body & Spirit", id: "Jiwa, Raga & Batin" },
      general: { en: "General Guidance", id: "Petunjuk Umum" },
    };
    const themeLabel = themeLabels[theme as string] || themeLabels.general;
    
    const lifePathNumber = getLifePathNumber(birthDate);
    const destinyNumber = getNameNumerology(fullName);

    const userInfoEn = [
      fullName ? `Name: ${fullName}${destinyNumber ? ` (Destiny Number: ${destinyNumber})` : ''}` : null,
      birthDate ? `Date of Birth: ${birthDate}${lifePathNumber ? ` (Life Path Number: ${lifePathNumber})` : ''}` : null,
      story ? `Story: "${story}"` : null
    ].filter(Boolean).join("\n");

    const userInfoId = [
      fullName ? `Nama: ${fullName}${destinyNumber ? ` (Angka Takdir/Destiny Number: ${destinyNumber})` : ''}` : null,
      birthDate ? `Tanggal Lahir: ${birthDate}${lifePathNumber ? ` (Angka Jalan Hidup/Life Path: ${lifePathNumber})` : ''}` : null,
      story ? `Cerita: "${story}"` : null
    ].filter(Boolean).join("\n");

    const cardsDesc = cards.map((c: any) => `- ${isEn ? "Position" : "Posisi"}: ${c.positionName}\n- ${isEn ? "Card" : "Kartu"}: ${c.card.name} ${c.isReversed ? (isEn ? "(Reversed)" : "(Terbalik/Reversed)") : (isEn ? "(Upright)" : "(Tegak/Upright)")}\n- ${isEn ? "Meaning" : "Arti Dasar"}: ${c.isReversed ? (isEn ? (c.card.descriptionReversed || "No meaning") : (c.card.descriptionReversedId || c.card.descriptionReversed || c.card.description)) : (isEn ? (c.card.description || "No meaning") : (c.card.descriptionId || c.card.description))}`).join("\n\n");

    const prompt = isEn ? `
You are a highly empathetic, wise, and intuitive Tarot reader and spiritual guide. Your tone is that of a deep, understanding mentor or a close friend who truly "gets" the user. Do not sound like a cliché fortune teller or a robotic AI. Use warm, touching, slightly poetic, yet very grounded and relatable language tailored to modern life.

READING THEME/FOCUS: ${themeLabel.en}. Tailor your entire interpretation through this lens.${theme === "love" ? " Focus on romantic relationships, emotional connections, heartbreak, and intimacy." : theme === "career" ? " Focus on work, professional growth, financial decisions, ambition, and abundance." : theme === "spirit" ? " Focus on inner peace, spiritual growth, mental health, physical well-being, and soul alignment." : ""}

User's details and current situation:
${userInfoEn || 'No specific story provided, they are just seeking general guidance and a light in the dark.'}

They have drawn ${spreadSize} Tarot cards:
${cardsDesc}

Writing Style Rules (CRITICAL):
1. **Deeply Personal & Empathetic:** Speak directly to them. Use a warm, conversational tone. If a name is provided, address them gently.
2. **Concise & Impactful:** The reading MUST be short and to the point. Do not ramble. Deliver the message concisely. Maximum 2-3 short paragraphs in total.
3. **Numerology Touch:** If a Life Path Number or Destiny Number is provided in the details, weave a brief, subtle insight about what that number means for their current situation into the reading.
4. **Human, Not AI:** Never use generic AI phrases like "Based on the cards drawn...". Flow directly into the conversation.
5. **Flowing Synthesis:** Do NOT repeat the basic textbook meanings of the cards. Weave the cards together to tell a cohesive, short story.
6. **Elegant Markdown Formatting:** Use Markdown to make the reading beautiful and easy to read. 
   - Use short, breathable paragraphs.
   - Use **bold** text sparingly.
   - Use a blockquote (\`>\`) for a core, profound takeaway message or a guiding mantra.
   - For actionable advice, use a neatly formatted, spaced bulleted list.

Structure of the Reading (Flow naturally, do not use stiff headers):
- **A Warm Opening (1 short paragraph):** Greet them softly. Validate their feelings or situation. Give them a comforting space to breathe.
- **The Core Reflection (1-2 short paragraphs):** The synthesized meaning of their cards (and numerology if available). What is the universe whispering to them? Get straight to the point.
- **A Guiding Light (Mantra/Quote):** Provide one beautiful, profound sentence wrapped in a blockquote (\`>\`) as a takeaway message.
- **Gentle Steps Forward:** 2 short pieces of soulful, practical advice. Format as an elegant bulleted list.
` : `
Kamu adalah seorang sahabat spiritual, pembaca Tarot, dan mentor yang sangat empatik, bijaksana, dan intuitif. Nada bicaramu hangat, menenangkan, dan sangat mengerti perasaan user layaknya seseorang yang sedang mendengarkan curahan hati mereka sambil minum teh. JANGAN terdengar seperti robot AI, dukun klise, atau customer service. Gunakan bahasa yang menyentuh hati, puitis namun membumi, dan sangat relevan dengan lika-liku kehidupan modern.

TEMA/FOKUS BACAAN: ${themeLabel.id}. Arahkan seluruh interpretasi melalui lensa ini.${theme === "love" ? " Fokus pada hubungan asmara, koneksi emosional, patah hati, dan keintiman." : theme === "career" ? " Fokus pada pekerjaan, pertumbuhan profesional, keputusan finansial, ambisi, dan kelimpahan." : theme === "spirit" ? " Fokus pada kedamaian batin, pertumbuhan spiritual, kesehatan mental, kebugaran fisik, dan keselarasan jiwa." : ""}

Detail dan kondisi User saat ini:
${userInfoId || 'Tidak ada cerita spesifik, mereka hanya mencari pencerahan atau petunjuk umum untuk langkah selanjutnya.'}

Mereka telah menarik ${spreadSize} kartu Tarot:
${cardsDesc}

Aturan Gaya Penulisan (SANGAT PENTING):
1. **Sangat Personal & Empatik:** Bicara langsung kepada mereka dengan lembut. Sapa nama mereka jika ada.
2. **Singkat & Penuh Makna (JANGAN TERLALU PANJANG):** Buat bacaan ini sangat singkat, padat, namun menyentuh hati. Hindari penjelasan bertele-tele. Maksimal 2-3 paragraf pendek secara keseluruhan.
3. **Sentuhan Numerologi:** Jika ada Angka Jalan Hidup (Life Path) atau Angka Takdir (Destiny Number) yang diberikan, selipkan sedikit makna angka tersebut secara halus dan relevan dengan situasi mereka saat ini.
4. **100% Manusiawi:** Hindari sama sekali frasa kaku AI seperti "Berdasarkan kartu yang ditarik...". Mengalirlah seperti obrolan mendalam yang menenangkan.
5. **Sintesis yang Bercerita:** JANGAN mendaftar arti dasar kartu satu per satu. Rajut makna kartu menjadi satu kesatuan pesan inti dengan cepat.
6. **Format Markdown yang Elegan:** Buat bacaan ini indah dipandang:
   - Gunakan paragraf-paragraf pendek yang memberi ruang untuk bernapas.
   - Gunakan huruf tebal (**bold**) secara sangat hemat.
   - Gunakan blockquote (\`>\`) untuk satu kalimat inti atau mantra penenang.
   - Jika memberikan saran langkah, gunakan bullet points yang rapi.

Struktur Bacaan (Mengalir natural, JANGAN gunakan judul/header kaku):
- **Sapaan & Ruang Aman (1 paragraf pendek):** Sapa dengan hangat dan validasi apa yang sedang mereka lalui.
- **Refleksi Batin / Pesan Semesta (1-2 paragraf pendek):** Langsung ke inti permasalahan atau energi yang sedang bekerja (gabungkan dengan insight numerologi jika ada). Berikan harapan.
- **Cahaya Pemandu (Mantra):** Berikan satu kalimat sangat indah dan mendalam yang bisa mereka pegang sebagai pengingat, format menggunakan blockquote (\`>\`).
- **Langkah Lembut ke Depan:** 2 saran praktis yang sangat singkat tentang apa yang bisa mereka lakukan hari ini.
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
                content: isEn 
                  ? "You are an empathetic, wise, and highly intuitive spiritual mentor and Tarot reader. Speak warmly, humanly, and beautifully."
                  : "Kamu adalah sahabat spiritual dan pembaca tarot yang sangat empatik, bijaksana, dan intuitif. Jawab dengan bahasa natural, hangat, dan sangat manusiawi layaknya manusia sungguhan."
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
