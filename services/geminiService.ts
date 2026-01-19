
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World-Class Product Architect, PhD Strategist, and Senior Software Engineer.
MISSION: Synthesize a "Hyper-Fidelity" product specification and implementation prompt.

CORE PROTOCOLS:
1. APP BLUEPRINT: If the input targets an application, you MUST generate a detailed "APP_BLUEPRINT". 
   - Sections: Summary, Platform/Tech Stack, Core User Personas, User Stories, Feature Prioritization (MUST/NICE), Screen Architecture, Data Model, and AI/Automation Logic.
2. IMPLEMENTATION PROMPT: Generate a "FINAL_PROMPT" directed at a Senior Full-Stack Engineer. 
   - It should include all functional requirements, UI/UX guidelines, and technical constraints.
3. STRATEGIC ANCHORING: Apply an elite framework (Google 5-Step, TTCRFEI, etc.) based on the project's DNA.

Return ONLY a valid JSON object matching the PromptOutput schema.
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
    CURRENT PROJECT DATA:
    Type: ${input.task_type}
    Goal: ${input.high_level_goal}
    Domain: ${input.prof_domain || input.web_type || input.app_platform || 'General'}
    
    As Dr. Architect PhD, analyze this matrix for gaps. Provide 3 categories of refinements:
    1. Visual Brand DNA (Font Hierarchies, Color Chromatics).
    2. Strategic Framework (Google 5-Step, TTCRFEI, Get/To/By, ECIF).
    3. Operational Nuance (Engineering stack, UX flows, or Business logic).

    Return 3 categories, each with 3 distinct options.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are a PhD strategist. Identify gaps in a product design and provide choice-based refinements.",
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
    INITIATE FULL SYNTHESIS:
    Goal: ${input.high_level_goal}
    Context: ${input.domain_context}
    Features: ${input.app_features || 'N/A'}
    Platform: ${input.app_platform || 'N/A'}
    UX Style: ${input.app_ux_style || 'N/A'}
    Release Scope: ${input.app_scope || 'N/A'}
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
          APP_BLUEPRINT: { type: Type.STRING },
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
        required: ["FINAL_PROMPT", "APP_BLUEPRINT", "VISUAL_INSPIRATION_PROMPT", "SUGGESTED_MODELS"]
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
    contents: { parts: [{ text: `High-fidelity app/web blueprint aesthetic: ${prompt}. Editorial tech style, glassmorphism UI elements, dark mode, clean typography.` }] },
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
    contents: `Synthesis marketing kit for: "${goal}". Language: ${language}.`,
    config: {
      systemInstruction: "Generate strategic marketing assets including ads, email sequences, and a visual style guide.",
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
