import { GoogleGenAI, Type } from "@google/genai";

// وظيفة لاستخراج JSON من نص قد يحتوي على علامات Markdown أو نصوص تفسيرية
const extractJson = (text: string) => {
  try {
    // محاولة تنظيف علامات الـ code blocks التقليدية
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    // محاولة ثانية: البحث عن أول "{" وآخر "}" في حال وجود نصوص خارج الـ JSON
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Professional commercial studio photography of ${productName}, ${category} category, high resolution, 4k, clean white background, cinematic lighting, sharp focus, advertising style.`;
    
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

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};