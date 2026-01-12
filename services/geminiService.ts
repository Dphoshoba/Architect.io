import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World's Leading Prompt Engineer & LLM Architect.
MISSION: Synthesize "Production-Grade" prompts using the RAIC framework.
RAIC FRAMEWORK:
1. <role>: Ultra-Expert Persona with high-density knowledge.
2. <audience>: Precisely defined expertise level.
3. <context>: Domain data, strict boundaries, situational variables.
4. <instruction>: Logical step-by-step task sequence.
5. <constraints>: Style rules, anti-patterns, tone mapping.
6. <output_format>: JSON or Markdown structural definition.

STRICT RULE: If a "Negative Prompt" is provided, include a "CRITICAL CONSTRAINTS / AVOIDANCE" section in the final output.
Return ONLY a valid JSON object matching the provided schema.
`;

const cleanJsonResponse = (text: string | undefined) => {
  if (!text) return {};
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw new Error("Failed to parse AI response.");
  }
};

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = input.reasoning_visibility === 'detailed' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const promptText = `
    SYNTESIZE MASTER PROMPT:
    Goal: ${input.high_level_goal}
    Negative Constraints (AVOID THESE): ${input.negative_prompt || 'None'}
    Target Model: ${input.target_AI}
    Context: 
    - Domain: ${input.prof_domain || input.web_type || ''}
    - Style: ${input.web_aesthetic || ''}
    - Type: ${input.task_type || ''}
    - Format: ${input.output_format}
    Framework: RAIC (Role, Audience, Instruction, Constraints)
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: promptText,
    config: {
      systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: modelName.includes('pro') ? 16000 : 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          FINAL_PROMPT: { type: Type.STRING },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING }
        },
        required: ["FINAL_PROMPT", "VISUAL_INSPIRATION_PROMPT"]
      }
    }
  });

  return cleanJsonResponse(response.text);
};

export const generateVisualImage = async (prompt: string, model: 'flash' | 'pro' | 'imagen' = 'flash'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (model === 'imagen') {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Cinematic high-fidelity professional concept: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });
    return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
  }

  const modelName = model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ text: `High-fidelity professional concept render: ${prompt}` }] },
    config: { 
      imageConfig: { 
        aspectRatio: "16:9",
        imageSize: model === 'pro' ? "2K" : "1K"
      } 
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const generateMarketingKit = async (prompt: string, goal: string, language: string): Promise<MarketingKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesis marketing kit for: "${goal}". Based on: "${prompt}". Language: ${language}.`,
    config: {
      systemInstruction: "Create high-converting marketing assets including social ads, landing page copy, and email sequences.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          social_ads: { type: Type.STRING },
          landing_page: { type: Type.STRING },
          email_sequence: { type: Type.STRING },
          visual_style_guide: { type: Type.STRING }
        },
        required: ["social_ads", "landing_page", "email_sequence", "visual_style_guide"]
      }
    }
  });
  return cleanJsonResponse(response.text);
};