
import { GoogleGenAI, Type } from "@google/genai";
import { LotteryType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAlphaBatch(
  type: LotteryType, 
  config: any, 
  history: number[][], 
  seedNumbers: number[]
) {
  try {
    const historySummary = history.length > 0 
      ? history.slice(0, 100).map(draw => draw.join(',')).join(' | ')
      : "Base de dados inicial baseada em tendências teóricas globais.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Aja como um Supercomputador de Análise Preditiva especializado em Loterias.
      
      CONTEXTO:
      Loteria: ${type} (1 a ${config.totalNumbers}, sortear ${config.drawCount}).
      Histórico Recente: [${historySummary}].
      Sementes do Usuário: [${seedNumbers.join(', ')}].
      
      MISSÃO:
      Gere exatamente 10 matrizes de jogos (games) que possuam a maior probabilidade estatística de acerto baseada em:
      1. CURVA DE BELL: A soma dos números deve estar entre ${config.idealSumRange[0]} e ${config.idealSumRange[1]}.
      2. FILTRO DE PARIDADE: Evite jogos 100% pares ou 100% ímpares.
      3. CLUSTERIZAÇÃO: Distribua as dezenas de forma que não fiquem todas em uma única linha ou coluna.
      4. FREQUÊNCIA: Misture números que saíram no histórico com números que estão em atraso (Hot/Cold Ratio).

      Responda APENAS um JSON com array 'games' contendo:
      - numbers (array inteiros ordenados)
      - strategy (nome técnico curto da lógica, ex: "Poisson Distribution")
      - probabilityScore (número de 0.90 a 0.99)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            games: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  numbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                  strategy: { type: Type.STRING },
                  probabilityScore: { type: Type.NUMBER }
                },
                required: ["numbers", "strategy", "probabilityScore"]
              }
            }
          },
          required: ["games"]
        }
      }
    });
    
    const data = JSON.parse(response.text);
    return data.games;
  } catch (error) {
    console.error("Deep Alpha Engine Error:", error);
    return null;
  }
}

export async function fetchLatestRealResults(type: LotteryType) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Pesquise e retorne os dados do ÚLTIMO concurso realizado da loteria ${type} no Brasil (Caixa Econômica Federal).
      Preciso do número do concurso, as dezenas sorteadas (ordenadas), a data do sorteio e o valor do prêmio acumulado ou pago.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contestNumber: { type: Type.STRING },
            numbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            date: { type: Type.STRING },
            prize: { type: Type.NUMBER },
            sourceUrl: { type: Type.STRING }
          },
          required: ["contestNumber", "numbers", "date", "prize"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Real Results Sync Error:", error);
    return null;
  }
}
