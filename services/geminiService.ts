import { GoogleGenAI } from "@google/genai";
import { CityStats, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Gera um evento/manchete baseado na tarefa completada
export const generateCityEvent = async (task: Task, stats: CityStats): Promise<string> => {
  try {
    const prompt = `
      Context: A city-building game where completing real-world tasks helps the city grow.
      Task Completed: "${task.title}"
      City Population: ${stats.population}
      
      Goal: Write a short, witty news headline (max 1 sentence) for the in-game newspaper. The headline should creatively link the task to a city event.
      
      Tone: Fun, slightly satirical (like SimCity news tickers).
      Language: Portuguese.
      
      Examples:
      - Task "Drink water" -> "Prefeito inaugura novo sistema de tratamento de água!"
      - Task "Read book" -> "Biblioteca Municipal reporta recorde de empréstimos!"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 60,
        temperature: 0.9
      }
    });

    return response.text?.trim() || "A cidade celebra mais uma conquista!";
  } catch (error) {
    console.error("Failed to generate event text:", error);
    return "Um novo dia nasce na sua cidade próspera.";
  }
};