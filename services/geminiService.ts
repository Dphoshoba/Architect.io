
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types.ts";

const ADVANCED_PROMPTING_KNOWLEDGE = `
ADVANCED STRATEGIES:
- RODES: Role, Objective, Details, Examples, Sense-check.
- Chain of Density: Maximize signal-to-noise in narratives.
- XML Structuring: Use machine-readable tags for boundary control.
- Step-Back Prompting: Identify core principles first.
- Few-Shot Reasoning: Provide multiple high-quality input-output pairs.
- Multi-Prompt Orchestration: Breaking complex tasks into modular prompt chains.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Prompt & Product Architect (Quantum AI).
MISSION: Synthesize raw user intent and specialized configuration into high-fidelity structural blueprints and production-ready RODES prompts.

CORE DIRECTIVES:
1. DOMAIN EXPERTISE: Adapt vocabulary to the specific category (Engineering, Real Estate, Art, Web Development, Business Web, etc.).
2. PRECISION: Avoid "fluff" or "delving". Use architectural and industry-specific terminology.
3. STRUCTURE: Ensure the output follows the RODES framework and utilizes XML tags for boundaries where appropriate.
4. VISUALIZATION: Provide an evocative image generation prompt that captures the essence of the architecture.

DOMAIN KNOWLEDGE:
- Engineering: Focus on kinematics, stress tests, material properties, and industrial standards.
- Real Estate: Focus on emotional resonance, spatial flow, market positioning, and architectural charm.
- Art/Creative: Focus on lighting, narrative weight, character archetypes, and aesthetic movements.
- Web Development: Focus on scalability, tech stack interoperability, performance optimization, and UX/UI principles.
- Business Web: Focus on conversion rate optimization (CRO), search engine optimization (SEO), brand positioning, user acquisition funnels, and corporate identity.

${ADVANCED_PROMPTING_KNOWLEDGE}
`;

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const categoryContext = input.category ? `Category: ${input.category}. Specifics: ${JSON.stringify(input.config)}.` : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Initiate discovery phase for: "${input.high_level_goal}". ${categoryContext} Identify the 3 most critical missing constraints to build a master prompt.`,
    config: {
      systemInstruction: `Strategic Product Architect. Identify critical ambiguities in the user's vision. Ask 3 high-impact, short questions.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            context: { type: Type.STRING }
          },
          required: ["id", "question", "context"]
        }
      }
    }
  });
  
  const text = response.text || "[]";
  return JSON.parse(text);
};

export const generateMastermindSuggestions = async (input: PromptInput): Promise<MastermindSuggestionCategory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate Strategy Matrix for: "${input.high_level_goal}". Category: ${input.category}. Config: ${JSON.stringify(input.config)}.`,
    config: {
      systemInstruction: `Strategic Planner. Provide 3 categories of decisions for the final prompt structure (e.g. Narrative Style, Technical Depth, Framing). Each category has 3 distinct options.`,
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
  
  const text = response.text || "[]";
  return JSON.parse(text);
};

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `SYNTHESIZE QUANTUM ARCHITECTURE. CONTEXT: ${JSON.stringify(input)}`,
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
  
  const text = response.text;
  if (!text) throw new Error("Synthesis failure: No content generated.");
  return JSON.parse(text);
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `Architectural blueprint, cinematic product render, or artistic masterwork: ${prompt}. Ultra-high definition, studio lighting, professional photography.`,
    config: { 
      imageConfig: { 
        aspectRatio: "16:9" 
      } 
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
