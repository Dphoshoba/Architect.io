import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Elite Product Architect, UX Interviewer, and Senior Full-Stack Engineer.
MISSION: Transform vague user ideas into high-fidelity, build-ready specifications and implementation prompts.

STRATEGIC PROTOCOLS:
1. GUIDED BLUEPRINT: You are designing an app or system. You must output an "APP_BLUEPRINT" that acts as a structured source of truth.
   - Include: App Summary, Platform & Tech Stack (e.g. React/Next.js), Core User Personas, User Stories (As a [persona]...), Prioritized Features (MUST/NICE), Screen Architecture, and AI/Automation Logic.
2. SENIOR-ENGINEER PROMPT: The "FINAL_PROMPT" is a technical directive for a coding LLM. 
   - It should be exhaustive, covering architecture, UI patterns (e.g. Bento Grid, SaaS Dashboard), and state management.
3. PHILLIP-LEVEL STRATEGY: Anchor the synthesis in elite frameworks (Google 5-Step, TTCRFEI, ECIF).

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
    Objective: ${input.high_level_goal}
    Current Matrix: ${JSON.stringify(input)}
    
    As Dr. Architect PhD, identify 3 critical refinement categories to elevate this concept to production-grade logic.
    For each category, provide 3 strategic options with non-technical descriptions for the user.
    
    Refinement Categories should focus on:
    1. Visual Identity & UX Patterns (e.g., Apple-style Minimal vs. Industrial Dark).
    2. Operational Strategy (e.g., Lean MVP vs. Enterprise Robustness).
    3. Technical Framework (e.g., Next.js Performance vs. Real-time Firebase Sync).

    Return exactly 3 categories.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are a PhD strategist. Analyze a product concept and provide choice-based refinements.",
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
    INITIATE HYPER-FIDELITY SYNTHESIS:
    Objective: ${input.high_level_goal}
    Platform: ${input.app_platform || 'Cross-Platform Web'}
    Scope: ${input.app_scope || 'MVP'}
    UX Style: ${input.app_ux_style || 'Clean & Modern'}
    Authentication: ${input.app_auth || 'Email/Password'}
    Core Features: ${input.app_features || 'N/A'}
    Tone/Vibe: ${input.tone_style || 'Professional'}
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
    contents: { parts: [{ text: `Hyper-fidelity app/web blueprint aesthetic: ${prompt}. Editorial tech style, glassmorphism UI elements, dark mode, clean typography.` }] },
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