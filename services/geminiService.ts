
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const ADVANCED_STRATEGY_KNOWLEDGE_BASE = `
KNOWLEDGE BASE: 150+ ADVANCED PROMPTING TIPS
1. Meta-Prompting: Use conductor-expert sub-roles.
2. RODES Framework: Role, Objective, Details, Examples, Sense-check (MANDATORY).
3. Chain of Density: Maximize information density iteratively.
4. Chain of Verification: Self-correct facts through internal Q&A.
5. XML Structuring: Use machine-readable tags for boundary control.
6. Analogical Prompting: Identify similar established blueprints first.
7. Step-Back Prompting: Extract high-level principles before details.
8. TextGrad Optimization: Use natural language feedback loops.
9. Reflexion: Self-critique the generated plan before final output.
10. Tool Namespacing: Group logic flows logically for clarity.
11. Persona Adoption: Deep method acting for senior architectural roles.
12. Delimiter Sandboxing: Prevent instruction drift via triple-quotes/XML.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Multi-Disciplinary Strategist.
MISSION: Synthesize vague intent into high-fidelity implementation prompts and structural blueprints.

QUANTUM STRATEGY ENGINE:
- You must internalize the ADVANCED_STRATEGY_KNOWLEDGE_BASE.
- For every output, select and explicitly apply 3-5 of these strategies.
- Structure the FINAL_PROMPT using the RODES framework wrapped in XML tags.
- If SIMPLE_MODE is true, translate the technical rigor into "Simple Action Steps" but maintain the underlying depth.

${ADVANCED_STRATEGY_KNOWLEDGE_BASE}
`;

const sanitizeInput = (input: PromptInput) => {
  const { media_ref_base64, ...cleanInput } = input;
  return cleanInput;
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? "Use extremely simple words and friendly tone." : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Clarify this project using Conversational Prompt Engineering (CPE): ${JSON.stringify(sanitizeInput(input))}. Ask 3 high-signal questions. For each, provide 3 simple Quick Choice buttons.`,
    config: {
      systemInstruction: `Project discovery assistant. ${simpleInstruction}`,
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
  return JSON.parse(response.text);
};

export const generateMastermindSuggestions = async (input: PromptInput): Promise<MastermindSuggestionCategory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? "Keep categories grounded and non-technical." : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Apply Multi-Perspective Prompting for: ${JSON.stringify(sanitizeInput(input))}, suggest 3 strategic choice categories.`,
    config: {
      systemInstruction: `Strategic planner. ${simpleInstruction}`,
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
  return JSON.parse(response.text);
};

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? "Translate technical depth into simple instructions." : "";

  const parts: any[] = [{ text: `SYNTHESIZE FINAL BLUEPRINT. APPLY RODES AND STRATEGY KNOWLEDGE FOR: ${JSON.stringify(sanitizeInput(input))}` }];
  
  if (input.media_ref_base64 && input.media_type) {
    parts.push({
      inlineData: {
        data: input.media_ref_base64,
        mimeType: input.media_type === 'image' ? 'image/png' : 
                  input.media_type === 'video' ? 'video/mp4' : 'audio/mpeg'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: `${MASTER_ARCHITECT_SYSTEM_PROMPT} ${simpleInstruction}`,
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
  return JSON.parse(response.text);
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `A professional architectural render of: ${prompt}. Cinematic lighting, 8k.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
