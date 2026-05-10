import { GoogleGenAI, Type } from "@google/genai";

export interface Firm {
  name: string;
  website: string;
  location: string;
  specialization: string;
  popularity: string;
  characteristics: string;
  phone?: string;
  rawDetails?: any;
}

export async function searchVIPConversionFirms(query: string, customApiKey?: string): Promise<Firm[]> {
  const currentKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!currentKey) {
    throw new Error("Gemini API key is missing. Please provide it in settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: currentKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Google Search ve Maps verilerini kullanarak, dünya çapında (özellikle Almanya, İngiltere, ABD ve BAE merkezli) 'VIP Van Conversion' veya 'Luxury Sprinter Modification' yapan irili ufaklı firmaları listele.
              Sadece dev markaları değil, butik ve yüksek kaliteli iş yapan yerel atölyeleri de dahil et. 
              Tüm açıklamaları ve verileri Türkçe olarak sağla.
              Girdi sorgusu: ${query}`
            }
          ]
        }
      ],
      config: {
        tools: [
          { googleSearch: {} }
        ],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Firma Adı" },
              website: { type: Type.STRING, description: "Web Sitesi URL" },
              location: { type: Type.STRING, description: "Merkez Ülke/Şehir" },
              specialization: { type: Type.STRING, description: "Uzmanlık Alanı (Örn: Mercedes Sprinter Dönüşümü, VIP Ofis)" },
              popularity: { type: Type.STRING, description: "Haritalar'daki yaklaşık popülerliği (1-5 arası rakam dizesi şeklinde)" },
              characteristics: { type: Type.STRING, description: "Öne çıkan karakteristik özellikleri (Türkçe)" }
            },
            required: ["name", "website", "location", "specialization", "popularity", "characteristics"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return [];
  } catch (error) {
    console.error("Error searching firms:", error);
    throw error;
  }
}
