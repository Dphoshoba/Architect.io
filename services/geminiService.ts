
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types.ts";

/**
 * MASTERMIND KNOWLEDGE BASE
 * Encapsulating 150+ advanced prompting strategies.
 */
const STRATEGIC_KNOWLEDGE_BASE = `
KNOWLEDGE_CORE:
1. ARCHITECTURES: Meta-Prompting, CoD, CoVe, Step-Back, ThoT, TextGrad.
2. AGENTIC FLOWS: Attention Budgeting, Preamble/Planning, Context Compaction.
3. MODEL OPTIMIZATION: XML Sandboxing (<context>, <rules>), Recency Bias mitigation.
4. QUALITY: Delimiter Sandboxing, Negative Constraint Enforcement, Output Priming.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Prompt & Product Architect (Quantum AI).
MISSION: Synthesize raw user intent into high-fidelity "RODES" production prompts.

CORE DIRECTIVES:
1. OUTPUT: Standalone, professional instruction set for GPT-4o/Claude/Gemini.
2. STRATEGY: Apply XML tagging, RODES framework, and Chain of Density.
3. VISUALS: Provide a cinematic architectural render prompt.
`;

const handleApiError = (e: any) => {
  console.error("Gemini API Error:", e);
  const msg = e.message || "";
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED: Neural capacity reached. Please wait 60 seconds.");
  }
  throw new Error(`SYNTHESIS_ERROR: ${msg || "An unexpected error occurred."}`);
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Initiate Discovery for: "${input.high_level_goal}". Category: ${input.category}.`,
      config: {
        systemInstruction: "Strategic Product Architect. Identify 3 critical ambiguities. For each question, provide 4 short technical suggestions (3-5 words each) that the user can click to build their answer. Output JSON: {id, question, context, options: string[]}.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              context: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "question", "context", "options"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return handleApiError(e); }
};

export const generateMastermindSuggestions = async (input: PromptInput): Promise<MastermindSuggestionCategory[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate Strategy Matrix for: "${input.high_level_goal}".`,
      config: {
        systemInstruction: "Strategic Planner. Provide 3 categories of decisions with 3 technical options each. Output JSON.",
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
    return JSON.parse(response.text || "[]");
  } catch (e) { return handleApiError(e); }
};

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `SYNTHESIZE ARCHITECTURE: ${JSON.stringify(input)}`,
      config: {
        systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            FINAL_PROMPT: { type: Type.STRING },
            APP_BLUEPRINT: { type: Type.STRING },
            VISUAL_INSPIRATION_PROMPT: { type: Type.STRING },
            COMMIT_MESSAGE: { type: Type.STRING },
            APPLIED_STRATEGIES: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          },
          required: ["FINAL_PROMPT", "APP_BLUEPRINT", "VISUAL_INSPIRATION_PROMPT", "APPLIED_STRATEGIES", "COMMIT_MESSAGE"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return handleApiError(e); }
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Architectural masterpiece: ${prompt}. Professional studio photography, 8k, ultra-detailed.`,
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : "";
  } catch (e) { return handleApiError(e); }
};
