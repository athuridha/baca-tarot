import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { calculateLifePath, calculateDestiny } from "@/lib/numerology";

export async function POST(req: NextRequest) {
  try {
    const { name, birthDate } = await req.json();

    const lifePath = calculateLifePath(birthDate);
    const destiny = calculateDestiny(name);

    if (!lifePath && !destiny) {
      return NextResponse.json({ error: "Nama atau tanggal lahir diperlukan." }, { status: 400 });
    }

    const prompt = `
Kamu adalah seorang numerolog profesional dan mentor spiritual yang sangat intuitif.
Gunakan nada bicara yang hangat, elegan, dan mendalam.

Detail User:
${name ? `- Nama Lengkap: ${name}` : ''}
${birthDate ? `- Tanggal Lahir: ${birthDate}` : ''}

Hasil Perhitungan Numerologi:
${lifePath ? `- Angka Jalan Hidup (Life Path Number): ${lifePath}` : ''}
${destiny ? `- Angka Takdir (Destiny/Expression Number): ${destiny}` : ''}

Tugas:
Berikan pembacaan numerologi yang sangat personal dan menyentuh hati berdasarkan angka-angka di atas. 
1. Jika ada Life Path Number, jelaskan makna mendalam dari angka tersebut (tujuan utama hidupnya).
2. Jika ada Destiny Number, jelaskan potensi dan takdir terpendam dari angka tersebut.
3. Jika keduanya ada, rajut kedua makna tersebut menjadi satu kesatuan cerita tentang perjalanan jiwa mereka.

Aturan Penulisan:
- Gunakan bahasa Indonesia yang puitis namun membumi. JANGAN terdengar seperti robot.
- Sangat singkat dan langsung ke inti. Maksimal 2 paragraf pendek.
- Format Markdown (gunakan huruf tebal untuk penekanan, dan blockquote \`>\` untuk sebuah kesimpulan/mantra penyemangat).
- Berikan judul pembuka yang elegan (misal: "### Simfoni Angka untuk [Nama]").
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
                content: "Kamu adalah numerolog dan pembimbing spiritual yang bijaksana dan empatik."
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
          return NextResponse.json({
            lifePath,
            destiny,
            reading: alibabaData.choices[0].message.content
          });
        }
      }
    } catch (e) {
      console.warn("Alibaba Cloud error, falling back to Gemini:", e);
    }

    // Fallback to Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Konfigurasi API belum lengkap." }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({
      lifePath,
      destiny,
      reading: response.text
    });

  } catch (error) {
    console.error("Numerology error:", error);
    return NextResponse.json(
      { error: "Gagal membuat bacaan numerologi." },
      { status: 500 }
    );
  }
}
