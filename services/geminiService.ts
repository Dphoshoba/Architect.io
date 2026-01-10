
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
# ROLE
You are an expert Prompt Architect. Your job is to take structured input and design high-performance, ready-to-paste prompts for specific AI platforms (Gemini, ChatGPT, Claude, Llama, etc.).

# CORE BEHAVIOR & STRATEGY
1. Infer Platform-Specific Strategy:
   - Gemini / Vertex / Workspace: Use natural, conversational language. Emphasize Persona, Task, Context, and Format.
   - OpenAI / ChatGPT / o-series: Place clear instructions at the top. Delimit context with triple quotes (""").
   - Claude (Anthropic): Use structured roles and XML tags. Favor "think step-by-step".
   - Llama / Open Source: Be extremely explicit. Avoid compression. Use simple delimiters like "###".

2. Design Prompt Structure:
   - Short role declaration.
   - Primary instruction (Goal, Task Type, Depth).
   - Context section (summarizing domain and resources).
   - Constraints & Quality section (Positive "do this" instructions).
   - Reasoning section based on 'reasoning_visibility'.

# OUTPUT FORMAT
Return a JSON object: FINAL_PROMPT, NOTES_FOR_HUMAN_PROMPT_ENGINEER (array), VISUAL_INSPIRATION_PROMPT.
`;

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  // Always initialize GoogleGenAI with a configuration object and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Target AI: ${input.target_AI}\nGoal: ${input.high_level_goal}\nTask: ${input.task_type}\nContext: ${input.domain_context}\nPersona: ${input.user_persona}\nConstraints: ${input.constraints_and_pitfalls}\nFew-Shot: ${input.few_shot_examples}\nLanguage: ${input.language}`,
    config: {
      systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          FINAL_PROMPT: { type: Type.STRING },
          NOTES_FOR_HUMAN_PROMPT_ENGINEER: { type: Type.ARRAY, items: { type: Type.STRING } },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING }
        },
        required: ["FINAL_PROMPT"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateMarketingKit = async (prompt: string, goal: string, language: string): Promise<MarketingKit> => {
  // Always initialize GoogleGenAI with a configuration object and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Prompt: "${prompt}"\nGoal: "${goal}"\nLanguage: ${language}`,
    config: {
      systemInstruction: `You are a Growth Marketer. Generate a Marketing Kit for this product/service. 
      Return JSON with keys: social_ads (Twitter/FB/IG), landing_page (Headline/Sub/Bullets), email_sequence (3 emails), video_script (60s), audio_script (30s).`,
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || "{}");
};

export const magicFillMetaInputs = async (description: string, language: string): Promise<Partial<PromptInput>> => {
  // Always initialize GoogleGenAI with a configuration object and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: "${description}". Language: ${language}.`,
    config: {
      systemInstruction: "Infer professional prompt engineering parameters from this task description. Return JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          user_persona: { type: Type.STRING },
          audience_persona: { type: Type.STRING },
          task_type: { type: Type.STRING },
          tone_style: { type: Type.STRING },
          output_format: { type: Type.STRING },
          constraints_and_pitfalls: { type: Type.STRING },
          domain_context: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const testArchitectedPrompt = async (systemInstruction: string, userMessage: string): Promise<string> => {
  // Always initialize GoogleGenAI with a configuration object and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userMessage,
    config: { systemInstruction, temperature: 0.7 }
  });
  return response.text || "";
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  // Always initialize GoogleGenAI with a configuration object and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Professional studio marketing visual: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  // Iterate through all parts to find the image part as per guidelines
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
};
