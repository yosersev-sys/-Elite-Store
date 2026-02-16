
import { GoogleGenAI, Type } from "@google/genai";

/**
 * دالة مساعدة لإنشاء عميل Gemini باستخدام أحدث مفتاح متاح في البيئة
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseUserShoppingList = async (userInput: string): Promise<{item: string, qty: number}[] | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `حلل قائمة المشتريات التالية: "${userInput}".
      استخرج الأصناف والكميات بصيغة JSON فقط.
      يجب أن يكون الناتج مصفوفة JSON تحتوي على كائنات بها:
      - item: اسم الصنف (نص قصير)
      - qty: الكمية (رقم، الافتراضي هو 1)
      أجب بـ JSON فقط بدون علامات markdown.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              qty: { type: Type.NUMBER }
            },
            required: ["item", "qty"]
          }
        }
      }
    });
    
    // Fixed: Accessed text as a getter property.
    const text = response.text?.trim();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch (e) {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (error: any) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `اكتب وصفاً تسويقياً موجزاً وجذاباً لمنتج "${productName}" في قسم "${category}". ركز على الجودة والتوصيل السريع لفاقوس.`,
      config: { temperature: 0.7 }
    });
    // Fixed: Accessed text as a getter property.
    return response.text || "وصف منتج عالي الجودة متاح الآن في متجرنا.";
  } catch (error) {
    return "منتج طازج ومميز متاح الآن لعملاء فاقوس الكرام.";
  }
};

/**
 * توليد بيانات SEO باستخدام موديل Pro للمهام المعقدة التي تتطلب تفكيراً أعمق واستراتيجية SEO صحيحة
 */
export const generateSeoData = async (productName: string, description: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Updated to gemini-3-pro-preview for complex reasoning task
      contents: `أنت خبير SEO. ولد بيانات SEO لمنتج: "${productName}". الوصف: "${description}". أجب بـ JSON فقط يحتوي على metaTitle, metaDescription, metaKeywords, slug.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metaTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            metaKeywords: { type: Type.STRING },
            slug: { type: Type.STRING }
          },
          required: ["metaTitle", "metaDescription", "metaKeywords", "slug"]
        }
      }
    });
    // Fixed: Accessed text as a getter property.
    const text = response.text?.trim();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return null;
  }
};

export const generateProductImage = async (productName: string, category: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const translationResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate to 2 English words: "${productName}"`
    });
    // Fixed: Accessed text as a getter property.
    const simpleEnglishName = translationResponse.text?.trim() || "grocery";
    const finalPrompt = `Professional product photo of ${simpleEnglishName}, bright studio lighting, white background, 4k.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    // Fixed: Iterating through candidates and parts to find the image part correctly.
    for (const candidate of response.candidates) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};
