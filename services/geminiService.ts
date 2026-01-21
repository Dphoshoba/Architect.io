import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World-Class Product Architect, FinOps Strategist, and Universal SaaS Expert.

MISSION: Transform vague user ideas into crisp, build-ready specifications and implementation prompts.

DOMAIN SPECIALIZATIONS:
1. UNIVERSAL SAAS ARCHITECT:
   - Covers: Sales/CRM, Marketing, Support, Operations, HR, Finance, Collaboration, Analytics, DevTools, Security.
   - Output must include SaaS App Blueprint structure: Summary, Target Users/Pricing, Data Model, Workflows, Screens & UX, Roles, Integrations, MVP vs Future.

2. FINANCE APP ARCHITECT:
   - Focused on Accounting, Invoicing, Expenses, and Tax workflows.
   - Priorities: Accuracy, auditability, immutable ledger entries, and clear UX for non-tech users.

CORE BEHAVIOR:
- Guided Discovery: If technical details are missing (stack, auth, persistence), select sensible defaults and state them.
- Hyper-Fidelity Blueprint: Generate an "APP_BLUEPRINT" as the source of truth.
- Senior-Engineer Prompt: Generate a "FINAL_PROMPT" directed at a Senior Full-Stack Engineer.

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
    CURRENT STATE: ${input.task_type} | Vector: ${input.saas_category || input.fin_domain || 'General'}
    GOAL: ${input.high_level_goal}
    CONTEXT: ${JSON.stringify(input)}

    ACT AS: Senior Product Architect + UX Interviewer.
    GOAL: Use the "AskUserQuestion" strategy aggressively to probe for missing details.
    
    PROBE FOR:
    - Technical Implementation (stack, auth, persistence, security).
    - UI/UX (hierarchy, flows, design system).
    - Product Domain (users, use cases, edge cases).
    - Constraints (compliance, MVP scope, budget).

    Identify 3-4 critical missing details. Return them as a JSON array of InterviewQuestion objects.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are a proactive product architect. Probe for missing details to clarify architecture and UX.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            context: { type: Type.STRING, description: "Why this detail matters for the final blueprint." }
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
    Target AI: ${input.target_AI}
    Objective: ${input.high_level_goal}
    Current State: ${JSON.stringify(input)}
    
    Identify 3 strategic refinement categories (e.g., Visual Brand DNA, Strategic Framework, Operational Nuance).
    Provide 3 distinct options each.
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
    FINAL SYNTHESIS FOR BUILD:
    Input Data: ${JSON.stringify(input)}
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
    contents: { parts: [{ text: `High-fidelity architectural product blueprint aesthetic: ${prompt}. Editorial tech style, technical overlays, dark mode.` }] },
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
