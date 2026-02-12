import { GoogleGenAI, Type } from "@google/genai";

// Fix: Instantiate GoogleGenAI inside functions to ensure fresh client for each call and support potential dynamic API key changes.

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    // Fix: Always use new instance before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `قم بكتابة وصف تسويقي جذاب ومختصر باللغة العربية لمنتج يسمى "${productName}" في قسم "${category}". ركز على الفوائد والجودة.`,
      config: { temperature: 0.7 }
    });
    // Fix: Access response.text property directly
    return response.text || "فشل في إنشاء الوصف.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
  }
};

export const generateSeoData = async (productName: string, description: string) => {
  try {
    // Fix: Always use new instance before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على المنتج "${productName}" والوصف "${description}"، قم بتوليد بيانات SEO باللغة العربية. 
      أريد عنوان Meta (أقل من 60 حرف)، وصف Meta (أقل من 160 حرف)، وقائمة كلمات مفتاحية مفصولة بفواصل.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metaTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            metaKeywords: { type: Type.STRING },
            slug: { type: Type.STRING, description: "URL friendly slug in English" }
          },
          required: ["metaTitle", "metaDescription", "metaKeywords", "slug"]
        }
      }
    });
    
    // Fix: Access response.text property directly and handle potential undefined
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("SEO AI Error:", error);
    return null;
  }
};