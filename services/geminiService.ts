
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "وصف المنتج متاح عند تفعيل الذكاء الاصطناعي.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `قم بكتابة وصف تسويقي جذاب ومختصر باللغة العربية لمنتج يسمى "${productName}" في قسم "${category}". ركز على الفوائد والجودة.`,
      config: { temperature: 0.7 }
    });
    return response.text || "فشل في إنشاء الوصف.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "وصف افتراضي: منتج عالي الجودة من فاقوس ستور.";
  }
};

export const generateSeoData = async (productName: string, description: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على المنتج "${productName}" والوصف "${description}"، قم بتوليد بيانات SEO باللغة العربية. 
      أريد عنوان Meta، وصف Meta، وقائمة كلمات مفتاحية مفصولة بفواصل، و slug إنجليزي.`,
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
    console.error("SEO AI Error:", error);
    return null;
  }
};
