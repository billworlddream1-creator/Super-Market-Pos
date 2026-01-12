
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProducts = async (category: string, count: number = 5): Promise<Partial<Product>[]> => {
  try {
    const prompt = `Generate ${count} realistic supermarket products for the category "${category}". 
    Include a creative name, a realistic price (USD), initial stock count (between 10 and 100), and a short description.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              stock: { type: Type.INTEGER },
              description: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["name", "price", "stock", "description", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    return rawData.map((item: any) => ({
      ...item,
      imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(item.name + ' ' + item.category)}`,
      isAiGenerated: true
    }));
  } catch (error) {
    console.error("Failed to generate products:", error);
    throw new Error("AI generation failed.");
  }
};

export const translateMessage = async (text: string, targetLanguage: string = 'Spanish'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following message to ${targetLanguage}: "${text}". Only return the translated text.`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
};

export const suggestReply = async (context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the last few messages in this staff chat, suggest a helpful, professional, and short reply: "${context}"`,
    });
    return response.text || "";
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return "";
  }
};

export const autocorrectText = async (text: string): Promise<string> => {
  if (!text.trim()) return text;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Strictly correct any spelling or grammar errors in the following text, and keep the tone professional but friendly. Do not add any conversational filler, just return the corrected text: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Autocorrect failed:", error);
    return text;
  }
};
