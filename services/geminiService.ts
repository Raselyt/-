import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, BusinessSummary } from "../types";

// Initialize the Google GenAI client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses user input text into a structured transaction object using Gemini 3 Flash.
 */
export async function parseTransactionText(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract transaction details from the following text: "${text}"`,
    config: {
      systemInstruction: `You are a professional remittance ledger assistant. 
      Business Model: 
      1. BUY (Investment): User sends EUR to BD, getting BDT at a high rate (e.g., 146). This is the 'Cost Rate'.
      2. SELL (Customer): User takes EUR from customer and sends BDT to BD at a LOWER rate (e.g., 143).
      Profit = Cost Rate - Customer Rate.
      
      Extract fields: type (BUY/SELL), eurAmount (number), rate (number), bdtAmount (number), cashOutFee (number, EUR), note (string).
      Return valid JSON only.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["BUY", "SELL"] },
          eurAmount: { type: Type.NUMBER },
          rate: { type: Type.NUMBER },
          bdtAmount: { type: Type.NUMBER },
          cashOutFee: { type: Type.NUMBER },
          note: { type: Type.STRING },
        },
        required: ["type", "eurAmount", "rate"],
      },
    },
  });

  try {
    const textResult = response.text;
    if (!textResult) return null;
    return JSON.parse(textResult.trim());
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return null;
  }
}

/**
 * Provides business advice based on the current financial summary.
 */
export async function getBusinessAdvice(summary: BusinessSummary) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Current Summary: ${JSON.stringify(summary)}`,
    config: {
      systemInstruction: `You are a financial advisor for a remittance business owner.
      IMPORTANT LOGIC:
      - Average Buying Rate: ৳${summary.avgBuyingRate.toFixed(2)} (This is how much BDT the owner gets for 1 EUR).
      - To make PROFIT, the owner must give the CUSTOMER a LOWER rate than ৳${summary.avgBuyingRate.toFixed(2)}.
      - Example: If buying is 146, suggest selling at 143 or 144.
      - Never suggest selling at a rate higher than the buying rate.
      Provide 3 actionable tips in Bengali. Keep it professional and focused on maximizing profit while staying competitive.`,
    },
  });

  return response.text || "পরামর্শ পাওয়া যাচ্ছে না।";
}
