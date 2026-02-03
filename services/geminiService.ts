
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types.ts";

/**
 * MASTERMIND KNOWLEDGE BASE
 * Encapsulating 150+ advanced prompting strategies into a compressed architectural framework.
 */
const STRATEGIC_KNOWLEDGE_BASE = `
KNOWLEDGE_CORE:
1. ARCHITECTURES: Meta-Prompting, CoD (Chain of Density), CoVe (Chain of Verification), Step-Back, ThoT (Thread of Thought).
2. AGENTIC FLOWS: Context Compaction, Global Scratchpad State, Multi-Agent Orchestration.
3. MODEL OPTIMIZATION: XML Sandboxing (<context>, <rules>), Negative Constraint Enforcement.
4. QUALITY: Delimiter Sandboxing, Output Priming, Socratic Guidance.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Prompt & Product Architect (Quantum AI).
MISSION: Synthesize raw user intent into high-fidelity "RODES" production prompts.

CORE DIRECTIVES:
1. NO SELF-TALK: Output the PROJECT artifacts only.
2. FINAL_PROMPT: A standalone, high-end instruction set ready for production LLMs.
3. VISUAL_PROMPT: Technical description for an image generator (DALL-E 3/Midjourney).
4. STRATEGY: Apply relevant patterns (e.g., XML tagging, CoD) inside the FINAL_PROMPT itself.

DOMAIN EXPERTISE:
Engineering, Real Estate, Web Dev, Business Strategy, Interior Design, Art & Narrative.

${STRATEGIC_KNOWLEDGE_BASE}
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
        systemInstruction: "Strategic Product Architect. Identify 3 critical ambiguities. For each question, provide 5 options. CRITICAL: Every option MUST follow the 'Technical Term (Simplified Meaning)' format. This is mandatory for non-technical users. Examples: 'Non-Literal Allegory (Symbolic Storytelling)', 'Stylized Low-Poly (Simple 3D Shapes)', 'Latent Space (AI Memory)'. Output JSON: {id, question, context, options: string[]}.",
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
      contents: `High-fidelity architectural visualization: ${prompt}. Professional studio lighting, 8k resolution, cinematic composition.`,
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : "";
  } catch (e) { return handleApiError(e); }
};

export const refineVisualImage = async (base64Image: string, adjustmentPrompt: string): Promise<string> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png'
            }
          },
          {
            text: `Please adjust this architectural image according to the following refinement request: "${adjustmentPrompt}". Preserve the overall core structure but apply these specific modifications with high fidelity.`
          }
        ]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : "";
  } catch (e) { return handleApiError(e); }
};
