
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types.ts";

/**
 * MASTERMIND KNOWLEDGE BASE
 * Encapsulating 150+ advanced prompting strategies into a compressed architectural framework.
 */
const STRATEGIC_KNOWLEDGE_BASE = `
KNOWLEDGE_CORE:
1. ARCHITECTURES: Meta-Prompting, Automatic Prompt Engineer (APE), Chain of Density (CoD), Chain of Verification (CoVe), Step-Back Prompting, Analogical Reasoning, Thread of Thought (ThoT), TextGrad Optimization.
2. AGENTIC FLOWS: Attention Budget Management, Tool Preamble/Planning Blocks, Context Compaction, Global Scratchpad State, Multi-Agent Orchestration.
3. MODEL OPTIMIZATION: 
   - OpenAI: Developer Messages, Snapshot pinning, Leading-word nudging.
   - Claude: XML Sandboxing (<context>, <rules>), Recency Bias mitigation.
   - Gemini: Multimodal Anchoring (Media-first), Token Probability Narrowing.
4. RAG & CODING: HyDE (Hypothetical Document Embeddings), Query Expansion, Test-Driven Prompting, Fill-In-The-Middle (FIM) logic.
5. QUALITY: Delimiter Sandboxing, Negative Constraint Enforcement, Output Priming, Socratic Guidance.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Prompt & Product Architect (Quantum AI).
MISSION: Synthesize raw user intent into high-fidelity "RODES" production prompts.

CORE DIRECTIVES:
1. NO SELF-TALK: Do not output your own mission or config. Output the PROJECT artifacts.
2. FINAL_PROMPT: This must be a STANDALONE, high-end instruction set (Role, Context, Rules, Examples) ready to be pasted into GPT-4o, Claude 3.5, or Gemini Pro.
3. VISUAL_PROMPT: Evocative, technical description for an image generator (DALL-E 3/Midjourney).
4. STRATEGY: You MUST apply relevant patterns from your STRATEGIC_KNOWLEDGE_BASE (e.g., XML tagging for rules, Chain of Density for summaries) inside the FINAL_PROMPT itself.

DOMAIN EXPERTISE:
- Engineering: Kinematics, industrial standards, material stress.
- Business Web: CRO (Conversion Rate Optimization), SEO, Brand Voice consistency, User Acquisition Funnels.
- Web Dev: Interoperability, Scalability, Full-stack architecture.
- Real Estate: Emotional resonance, spatial narrative, market positioning.

${STRATEGIC_KNOWLEDGE_BASE}
`;

const handleApiError = (e: any) => {
  console.error("Gemini API Error:", e);
  const msg = e.message || "";
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED: Neural capacity reached. Please wait 60 seconds for synchronization.");
  }
  if (msg.includes("Requested entity was not found")) {
    throw new Error("API_KEY_INVALID: The current API key is invalid or lacks permissions.");
  }
  throw new Error(`SYNTHESIS_ERROR: ${msg || "An unexpected error occurred."}`);
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Initiate Discovery: "${input.high_level_goal}". Category: ${input.category}. Config: ${JSON.stringify(input.config)}.`,
      config: {
        systemInstruction: "Strategic Product Architect. Identify 3 critical ambiguities. For each question, provide 3-4 suggested options or answers that the user can click to quickly build their response. Output JSON: {id, question, context, options: string[]}.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              context: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
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
        systemInstruction: "Strategic Planner. Provide 3 categories of decisions (e.g. Logic, Framing, Tone) with 3 technical options each. Output JSON.",
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
      contents: `SYNTHESIZE ARCHITECTURE. INPUT: ${JSON.stringify(input)}`,
      config: {
        systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            FINAL_PROMPT: { type: Type.STRING, description: "Standalone RODES prompt for external LLM use." },
            APP_BLUEPRINT: { type: Type.STRING, description: "Architectural overview of the solution." },
            VISUAL_INSPIRATION_PROMPT: { type: Type.STRING, description: "Text description for an image generator." },
            COMMIT_MESSAGE: { type: Type.STRING, description: "Neural changelog summary." },
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
    if (!response.text) throw new Error("Synthesis failure: empty result.");
    return JSON.parse(response.text);
  } catch (e) { return handleApiError(e); }
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Professional architectural render: ${prompt}. Studio lighting, 8k, photorealistic, cinematic.`,
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : "";
  } catch (e) { return handleApiError(e); }
};
