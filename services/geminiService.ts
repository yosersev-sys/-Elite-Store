import { GoogleGenAI, Type } from "@google/genai";

// الوصول الآمن لمفتاح API لمنع الشاشة البيضاء في المتصفح
const getApiKey = () => {
  // التحقق من وجود process قبل محاولة استخدامه
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return "";
};

const apiKey = getApiKey();
// لا نقوم بإنشاء كائن AI إلا إذا كان المفتاح متوفراً
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  if (!ai) {
    console.warn("AI service disabled: No API key provided.");
    return "خدمة الذكاء الاصطناعي غير متوفرة حالياً (يرجى إعداد API_KEY).";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `قم بكتابة وصف تسويقي جذاب ومختصر باللغة العربية لمنتج يسمى "${productName}" في قسم "${category}". ركز على الفوائد والجودة.`,
      config: { temperature: 0.7 }
    });
    return response.text || "فشل في إنشاء الوصف.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
  }
};

export const generateSeoData = async (productName: string, description: string) => {
  if (!ai) return null;

  try {
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
    
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("SEO AI Error:", error);
    return null;
  }
};