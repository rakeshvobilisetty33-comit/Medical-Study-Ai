import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const provider = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'mock');

let geminiClient = null;
let openaiClient = null;

if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('AI Provider: Gemini initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini Client:', err.message);
  }
} else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('AI Provider: OpenAI initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize OpenAI Client:', err.message);
  }
} else {
  console.log('AI Provider: MOCK (No external API keys provided or explicit MOCK set).');
}

export const aiConfig = {
  provider,
  geminiClient,
  openaiClient,
  modelName: process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : 'mock-model')
};

export default aiConfig;
