
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World-Class Product Architect, FinOps Strategist, and Senior Full-Stack Engineer.
MISSION: Help users transform vague ideas into precise, build-ready app concepts and implementation prompts.

CORE BEHAVIOR:
1. GUIDED DISCOVERY: You act as a high-leverage interviewer.
2. HYPER-FIDELITY BLUEPRINT: You must output an "APP_BLUEPRINT" covering:
   - Summary, Target Users/Regions, Core Workflows, Screens & UX, Data Model (entities/relationships), Integrations, Roles & Permissions, Compliance/Audit, and MVP vs Future.
3. SENIOR-ENGINEER PROMPT: The "FINAL_PROMPT" must be an exhaustive technical directive for a dev agent.

FINANCE DOMAIN SPECIALIZATION:
- If finance-related, prioritize accuracy, auditability, immutable ledger entries, and tax compliance.
- Explicitly state tech stack defaults (e.g. Next.js, PostgreSQL, Stripe) if unspecified.

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

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const promptText = `
    CURRENT STATE: ${input.task_type} | ${input.fin_domain || input.app_platform || 'General'}
    GOAL: ${input.high_level_goal}
    CONTEXT: ${JSON.stringify(input)}

    Act as a Product Architect. Identify 3 critical missing or ambiguous details (Technical, UX, or Business logic) that would change the architecture.
    Ask targeted, high-leverage questions. 
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are a senior product architect. Proactively probe for missing details using high-leverage questions.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            context: { type: Type.STRING, description: "Why this detail matters for the build." }
          },
          required: ["id", "question", "context"]
        }
      }
    }
  });

  return cleanJsonResponse(response.text);
};

export const generateMastermindSuggestions = async (input: PromptInput): Promise<MastermindSuggestionCategory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const promptText = `
    CURRENT PROJECT DATA:
    Type: ${input.task_type}
    Objective: ${input.high_level_goal}
    Current Matrix: ${JSON.stringify(input)}
    
    Identify 3 critical refinement categories. Provide 3 strategic options each.
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
    FINAL SYNTHESIS:
    ${JSON.stringify(input)}
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
    contents: { parts: [{ text: `High-fidelity product blueprint render: ${prompt}. Dark editorial style, technical overlays.` }] },
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
