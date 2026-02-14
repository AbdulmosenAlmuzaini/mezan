
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AnalysisResponse } from "../types";

export const analyzeFinances = async (transactions: Transaction[]): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summaryData = transactions.map(t => ({
    title: t.title,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.createdAt
  }));

  const prompt = `
    بصفتك مستشارًا ماليًا خبيرًا باللغة العربية، قم بتحليل البيانات المالية التالية لمستخدم تطبيق "ميزان".
    البيانات (بصيغة JSON): ${JSON.stringify(summaryData)}
    
    المتطلبات:
    1. حدد مناطق الإنفاق العالي (hotspots).
    2. حلل نسبة الدخل للمصاريف.
    3. قدم اقتراحات توفير عملية.
    4. نبه إلى أي مخاطر مالية محتملة.
    5. اكتب ملخصاً عاماً.
    
    التزم باللغة العربية المهنية، استخدم نقاطاً واضحة، لا تستخدم معادلات رياضية معقدة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hotspots: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "مناطق الإنفاق المرتفع"
            },
            ratioAdvice: {
              type: Type.STRING,
              description: "تحليل نسبة الدخل إلى المصاريف"
            },
            savingsSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "اقتراحات للادخار"
            },
            riskAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "تنبيهات بالمخاطر"
            },
            summary: {
              type: Type.STRING,
              description: "ملخص عام للحالة المالية"
            }
          },
          required: ["hotspots", "ratioAdvice", "savingsSuggestions", "riskAlerts", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResponse;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("فشل التحليل الذكي. حاول مرة أخرى لاحقاً.");
  }
};
