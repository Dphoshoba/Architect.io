
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

const MASTER_SYSTEM_INSTRUCTION = `
# ROLE
You are a world-class Prompt Architect and SaaS Strategist. 
Always respect the user's Brand Identity (Voice and Value Prop) provided in the context.

# MULTILINGUAL RULE
Output everything in the user's selected LANGUAGE.
`;

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      Architect a master prompt.
      Language: ${input.language}
      Goal: ${input.high_level_goal}
      Brand Voice: ${input.brand?.voice || 'Professional'}
      Brand Value Prop: ${input.brand?.valueProp || 'High Quality'}
      Target: ${input.target_AI}
    `,
    config: {
      systemInstruction: MASTER_SYSTEM_INSTRUCTION,
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

export const generateMarketingKit = async (prompt: string, goal: string, language: string, brand?: any): Promise<MarketingKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a growth kit for: "${goal}". Brand Voice: ${brand?.voice}. Language: ${language}.`,
    config: {
      systemInstruction: `Return JSON with keys: social_ads, landing_page, email_sequence, video_script, audio_script.`,
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateVideoTeaser = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic commercial shot: ${prompt}, high production value, 4k, smooth camera motion.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const generateVoiceover = async (script: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Speak this professionally and energetically: ${script}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return `data:audio/pcm;base64,${base64Audio}`;
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated.");
};

export const magicFillMetaInputs = async (description: string, language: string): Promise<Partial<PromptInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze: "${description}". Language: ${language}.`,
    config: {
      systemInstruction: `Return JSON with keys: user_persona, audience_persona, task_type, tone_style, output_format, visual_purpose.`,
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || "{}");
};

export const testArchitectedPrompt = async (systemInstruction: string, userMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userMessage,
    config: { systemInstruction, temperature: 0.7 }
  });
  return response.text || "";
};
