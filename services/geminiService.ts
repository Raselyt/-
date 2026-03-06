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
 * Provides business advice based on the current financial summary using real-time market data.
 */
export async function getBusinessAdvice(summary: BusinessSummary) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Current Summary: ${JSON.stringify(summary)}. 
    Please check the current EUR to BDT market exchange rate and provide advice.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `You are a financial advisor for a remittance business owner in Italy sending money to Bangladesh.
      
      TASKS:
      1. Find the current real-time EUR to BDT exchange rate using Google Search.
      2. Compare the current market rate with the owner's Average Buying Rate: ৳${summary.avgBuyingRate.toFixed(2)}.
      3. Suggest a competitive 'Customer Rate' (Selling Rate). 
         - Logic: To make PROFIT, the owner must give the CUSTOMER a LOWER rate than their Buying Rate.
         - Recommendation: Suggest a rate that is roughly 2.5 to 3.5 Taka lower than their Buying Rate, but also consider the current market rate to stay competitive.
      
      OUTPUT FORMAT:
      You MUST start your response with exactly this format:
      MARKET_RATE: [number]
      SUGGESTED_RATE: [number]
      ADVICE: [your 3 tips in Bengali]
      
      Example:
      MARKET_RATE: 144.50
      SUGGESTED_RATE: 142.00
      ADVICE: ১. বর্তমান বাজার দর অনুযায়ী রেট সেট করুন...`,
    },
  });

  const text = response.text;
  if (!text) return null;

  try {
    const marketRateMatch = text.match(/MARKET_RATE:\s*([\d.]+)/);
    const suggestedRateMatch = text.match(/SUGGESTED_RATE:\s*([\d.]+)/);
    const adviceMatch = text.match(/ADVICE:\s*([\s\S]+)/);

    return {
      marketRate: marketRateMatch ? parseFloat(marketRateMatch[1]) : null,
      suggestedRate: suggestedRateMatch ? parseFloat(suggestedRateMatch[1]) : null,
      advice: adviceMatch ? adviceMatch[1].trim() : text
    };
  } catch (error) {
    console.error("Error parsing AI text response:", error);
    return {
      marketRate: null,
      suggestedRate: null,
      advice: text
    };
  }
}
