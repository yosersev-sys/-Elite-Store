import { GoogleGenAI, Type } from "@google/genai";

// وظيفة لاستخراج JSON من نص قد يحتوي على علامات Markdown أو نصوص تفسيرية
const extractJson = (text: string) => {
  try {
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonOnly = text.substring(start, end + 1);
        return JSON.parse(jsonOnly);
      }
    } catch (innerErr) {
      console.error("Failed to parse JSON even after extraction", innerErr);
    }
    return null;
  }
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `قم بكتابة وصف تسويقي جذاب ومختصر باللغة العربية لمنتج يسمى "${productName}" في قسم "${category}". ركز على الفوائد والجودة وسرعة التوصيل في فاقوس.`,
      config: { temperature: 0.7 }
    });
    return response.text || "فشل في إنشاء الوصف.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
  }
};

export const generateSeoData = async (productName: string, description: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على المنتج "${productName}" والوصف "${description}"، قم بتوليد بيانات SEO احترافية للمتجر باللغة العربية. 
      أريد النتيجة ككائن JSON يحتوي على:
      - metaTitle (أقل من 60 حرف)
      - metaDescription (أقل من 160 حرف جذاب للعملاء)
      - metaKeywords (كلمات مفتاحية مفصولة بفواصل)
      - slug (رابط صديق لمحركات البحث باللغة العربية أو الإنجليزية)
      ملاحظة: أجب بـ JSON فقط وبدون أي مقدمات.`,
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
    
    let text = response.text;
    if (!text) return null;

    return extractJson(text);
  } catch (error) {
    console.error("SEO AI Error:", error);
    return null;
  }
};

export const generateProductImage = async (productName: string, category: string): Promise<string | null> => {
  try {
    // التأكد من تهيئة Instance جديد عند كل طلب لضمان تحديث الـ API Key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // برومبت محسن وأكثر بساطة لتجنب الرفض
    const prompt = `Professional product photo of ${productName} (${category}), clean white studio background, high resolution, 4k, realistic lighting, sharp focus, professional ecommerce photography.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      console.warn("No candidates returned from Image AI");
      return null;
    }

    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("Image part not found in response");
    return null;
  } catch (error) {
    console.error("Critical Image Generation Error:", error);
    return null;
  }
};