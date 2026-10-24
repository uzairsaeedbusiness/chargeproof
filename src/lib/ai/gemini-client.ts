import { GoogleGenAI } from '@google/genai';

let geminiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'demo-gemini-key') {
    return null;
  }

  if (!geminiInstance) {
    geminiInstance = new GoogleGenAI({ apiKey });
  }

  return geminiInstance;
}
