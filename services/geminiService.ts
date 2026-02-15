
import { GoogleGenAI, Type } from "@google/genai";

export const parseUserShoppingList = async (userInput: string): Promise<{item: string, qty: number}[] | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // استخدام نموذج Gemini 3 Flash للسرعة والدقة في استخراج البيانات
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `حلل قائمة المشتريات التالية باللهجة المصرية أو العربية الفصحى: "${userInput}".
      استخرج منها الأصناف والكميات.
      يجب أن يكون الناتج مصفوفة JSON فقط. 
      - item: اسم الصنف (كلمة واحدة أو كلمتين بحد أقصى، مثلاً "طماطم" بدلاً من "2 كيلو طماطم").
      - qty: الرقم فقط (مثلاً 2).
      إذا لم يذكر رقم، افترضه 1.
      مثال: [{"item": "سكر", "qty": 3}]`,
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
    
    const text = response.text?.trim();
    if (!text) return null;

    // في وضع application/json، يعيد Gemini نص JSON خالصاً
    try {
      return JSON.parse(text);
    } catch (e) {
      // محاولة احتياطية في حال وجود علامات Markdown
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (error) {
    console.error("AI Parsing Error:", error);
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
    return response.text || "وصف منتج عالي الجودة متوفر في سوق العصر.";
  } catch (error) {
    return "منتج طازج ومميز متاح الآن لعملاء فاقوس الكرام.";
  }
};

export const generateSeoData = async (productName: string, description: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `أنت خبير SEO. ولد بيانات SEO لمنتج: "${productName}". الوصف: "${description}". أجب بـ JSON فقط يحتوي على metaTitle, metaDescription, metaKeywords, slug.`,
      config: { responseMimeType: "application/json" }
    });
    const text = response.text?.trim();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return null;
  }
};

export const generateProductImage = async (productName: string, category: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const translationResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate this Arabic grocery item to 2 English keywords: "${productName}"`
    });
    const simpleEnglishName = translationResponse.text?.trim() || "grocery item";
    const finalPrompt = `Professional product photography of ${simpleEnglishName}, bright studio lighting, white background, 4k resolution.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    } as any);

    if (!response.candidates?.[0]?.content?.parts) return null;
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};
