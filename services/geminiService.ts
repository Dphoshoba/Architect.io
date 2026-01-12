import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

If website construction shards (web_type, layout, aesthetic, typography, colors) are provided, integrate them into a comprehensive design-system-first prompt. 
Ensure the final prompt includes specific instructions for typography pairing, spacing hierarchy, and interaction design based on the aesthetic provided.

Return ONLY a valid JSON object matching the provided schema. No additional text.
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
  const modelName = input.reasoning_visibility === 'detailed' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const promptText = `
    Synthesize a master prompt for model: ${input.target_AI}
    Core Objective: ${input.high_level_goal}
    
    Website Design System Shards:
    - DNA: ${input.web_type || 'General'}
    - Layout Shards: ${input.web_layout_blocks || 'None'}
    - Visual Aesthetic: ${input.web_aesthetic || 'Modern'}
    - Typography Protocol: ${input.web_typography || 'Standard'}
    - Color Matrix: ${input.web_colors || 'Standard'}
    
    Technical Constraints:
    - Tone: ${input.tone_style}
    - Format: ${input.output_format}
    - Reasoning Depth: ${input.reasoning_visibility}
    - Language: ${input.language}
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: promptText,
    config: {
      systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: modelName.includes('pro') ? 32000 : 4096 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          FINAL_PROMPT: { type: Type.STRING, description: 'The complete RAIC framework prompt.' },
          NOTES_FOR_HUMAN_PROMPT_ENGINEER: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Internal implementation notes.' },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING, description: 'A detailed prompt for generating a visual design concept.' }
        },
        required: ["FINAL_PROMPT", "VISUAL_INSPIRATION_PROMPT"]
      }
    }
  });

  return cleanJsonResponse(response.text);
};

export const magicFillMetaInputs = async (description: string, language: string): Promise<Partial<PromptInput>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze intent: "${description}". Synthesize RAIC metadata for professional engineering. Language: ${language}.`,
    config: {
      systemInstruction: "You are a Metadata Architect. Map user intent to Role, Task, Tone, and Format shards.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          user_persona: { type: Type.STRING },
          task_type: { type: Type.STRING },
          tone_style: { type: Type.STRING },
          output_format: { type: Type.STRING }
        }
      }
    }
  });
  return cleanJsonResponse(response.text);
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `High-fidelity professional architectural/UI concept render, ultra-realistic, cinematic lighting, 8k resolution, minimalist yet sophisticated: ${prompt}` }] },
    config: { 
      imageConfig: { aspectRatio: "16:9" } 
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const generateMarketingKit = async (prompt: string, goal: string, language: string): Promise<MarketingKit> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this synthesized architecture: "${prompt}", create a high-performance marketing kit for: "${goal}". Language: ${language}.`,
    config: {
      systemInstruction: "Create high-converting, psychologically-grounded marketing assets.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          social_ads: { type: Type.STRING },
          landing_page: { type: Type.STRING },
          email_sequence: { type: Type.STRING },
          video_script: { type: Type.STRING },
          audio_script: { type: Type.STRING },
          visual_style_guide: { type: Type.STRING }
        }
      }
    }
  });
  return cleanJsonResponse(response.text);
};