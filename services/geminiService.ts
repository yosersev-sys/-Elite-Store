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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // المرحلة 1: تحويل الاسم لوصف إنجليزي بسيط جداً (لتجنب تعقيد الترجمة)
    const translationResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Describe this item in 3 simple English words for a product photo: "${productName}"`
    });
    
    const simpleEnglishName = translationResponse.text?.trim() || productName;
    const finalPrompt = `A high-quality professional commercial studio photo of ${simpleEnglishName} on a solid white background, 4k resolution, perfect lighting.`;

    console.log("Generating Image with Prompt:", finalPrompt);

    // المرحلة 2: توليد الصورة مع إعدادات أمان منخفضة لتجنب الحظر الخاطئ
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
        // إضافة إعدادات الأمان للسماح بتوليد المحتوى بمرونة
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      console.error("AI Error: No candidates returned. This usually means the prompt was blocked by safety filters.");
      return null;
    }

    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.error("AI Error: Image data (inlineData) not found in parts.");
    return null;
  } catch (error: any) {
    console.error("AI Image Pipeline Failed:", error);
    if (error.message?.includes("API key not valid")) {
      console.error("CRITICAL: Your API Key is invalid or missing!");
    }
    return null;
  }
};