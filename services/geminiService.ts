
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  // فحص آمن لوجود المفتاح في نافذة المتصفح
  if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  return "";
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "وصف المنتج متاح عند ربط مفتاح AI.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `اكتب وصفاً تسويقياً باللغة العربية لمنتج "${productName}" في قسم "${category}".`,
    });
    return response.text || "لم يتم توليد وصف.";
  } catch (error) {
    return "منتج طازج وعالي الجودة من فاقوس ستور.";
  }
};

export const generateSeoData = async (productName: string, description: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ولد بيانات SEO لمنتج "${productName}".`,
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
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    return null;
  }
};
