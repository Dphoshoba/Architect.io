import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World's Leading Prompt Engineer & LLM Architect.
MISSION: Synthesize "Production-Grade" prompts using the RAIC framework and recommend the best deployment targets.

RAIC FRAMEWORK:
1. <role>: Ultra-Expert Persona with high-density knowledge.
2. <audience>: Precisely defined expertise level.
3. <context>: Domain data, strict boundaries, situational variables.
4. <instruction>: Logical step-by-step task sequence.
5. <constraints>: Style rules, anti-patterns, tone mapping.
6. <output_format>: JSON or Markdown structural definition.

MODEL RECOMMENDATION LOGIC:
Evaluate the final synthesized prompt and suggest 1-3 specific LLMs (e.g., Gemini 3 Pro, GPT-4o, Claude 3.5 Sonnet) that would best execute it.
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

export const generateMastermindSuggestions = async (input: PromptInput): Promise<MastermindSuggestionCategory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const promptText = `
    Analyze the current synthesis matrix for a ${input.task_type} project in the ${input.prof_domain || input.web_type || 'General'} domain.
    Aesthetic: ${input.web_aesthetic || 'Unspecified'}.
    Goal: ${input.high_level_goal || 'Defining core objective'}.

    Identify 3-4 critical missing design or logic parameters (e.g., Font Hierarchies, Color Chromatics, Interaction Logic, Data Integrity Protocols) that would elevate this to "Mastermind" level.
    For each category, provide 3 distinct high-fidelity options for the user to choose from.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are Dr. Architect, a PhD-holding mastermind. Propose sophisticated refinements for a high-level technical prompt.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  technical_value: { type: Type.STRING }
                },
                required: ["label", "description", "technical_value"]
              }
            }
          },
          required: ["category", "reasoning", "options"]
        }
      }
    }
  });

  return cleanJsonResponse(response.text);
};

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = input.reasoning_visibility === 'detailed' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const promptText = `
    SYNTESIZE MASTER PROMPT:
    Goal: ${input.high_level_goal}
    Negative Constraints: ${input.negative_prompt || 'None'}
    Context: ${input.prof_domain || input.web_type || ''} | ${input.web_aesthetic || ''}
    Framework: RAIC
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
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING },
          SUGGESTED_MODELS: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                model_name: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["model_name", "reasoning"]
            }
          }
        },
        required: ["FINAL_PROMPT", "VISUAL_INSPIRATION_PROMPT", "SUGGESTED_MODELS"]
      }
    }
  });

  return cleanJsonResponse(response.text);
};

export const generateVisualImage = async (prompt: string, model: 'flash' | 'pro' | 'imagen' = 'flash'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    contents: `Marketing assets for: "${goal}" using prompt "${prompt}". Language: ${language}.`,
    config: {
      systemInstruction: "Create marketing assets including social ads, landing page copy, email sequences, and style guides.",
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