import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
if (import.meta.env.VITE_GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
}

export async function generateInsights(userStats) {
  if (!genAI) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an AI life coach integrated into a modern habit tracker dashboard.
Based on the user's current progress today, please provide exactly 2 short, distinct, motivating insights or tips. Look at what they are missing or succeeding in.
Format your response as a JSON array of objects, where each object has an "icon" (a single relevant emoji) and "text" (a 1-2 sentence short insight). No markdown code blocks, just raw JSON. Do not include \`\`\`json at the start.

User Stats for Today:
- Tasks Completed: ${userStats.tasks.completed}/${userStats.tasks.total}
- Habits Completed: ${userStats.habits.todayCompleted}/${userStats.habits.total}
- Longest Habit Streak: ${userStats.habits.longestStreak} days
- Current Habit Active Streak: ${userStats.habits.currentStreak} days
- 30-Day Consistency: ${userStats.habits.consistencyPercent}%`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Parse the JSON (clean up any markdown around it just in case)
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").replace(/^\s*\[/g, "[").trim();
    
    // Find where the brackets start and end to ensure safe parsing
    const startIndex = cleanedText.indexOf('[');
    const endIndex = cleanedText.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
       const jsonStr = cleanedText.substring(startIndex, endIndex + 1);
       const insights = JSON.parse(jsonStr);
       return insights;
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
