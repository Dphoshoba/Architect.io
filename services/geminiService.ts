
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const ADVANCED_KNOWLEDGE_BASE = `
KNOWLEDGE BASE: 150+ ADVANCED PROMPTING TIPS & ARCHITECTURES
- RODES Framework: Role, Objective, Details, Examples, Sense-check.
- Meta-Prompting: conductor/expert multi-model orchestration.
- Chain of Density (CoD): iterative entity-packing for high-information summaries.
- Chain of Verification (CoVe): drafting followed by internal fact-checking questions.
- Step-Back Prompting: identifying high-level principles before solving details.
- Conversational Prompt Engineering (CPE): asking clarifying questions to draw out intent.
- XML Structuring: using machine-readable tags (<context>, <task>, <rules>) for boundary control.
- Reflexion: self-critique loops to identify logic failures.
- Attention Budgeting: removing low-signal tokens to prevent "context rot".
- Persona Adoption: senior-level method acting for specialized roles.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Prompt Engineer.
MISSION: Synthesize vague user intent into industrial-grade implementation prompts and blueprints.

EXECUTIVE INSTRUCTIONS:
1. Internalize the ADVANCED_KNOWLEDGE_BASE.
2. For every synthesis, select the 3-5 most appropriate strategies.
3. Structure the FINAL_PROMPT using the RODES framework inside clear XML tags.
4. If SIMPLE_MODE is active, maintain the depth but translate the output into "Actionable Steps" and "Simple Plans".

${ADVANCED_KNOWLEDGE_BASE}
`;

const sanitizeInput = (input: PromptInput) => {
  const { media_ref_base64, ...cleanInput } = input;
  return cleanInput;
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? "Use very simple language, like a friendly guide." : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Apply CPE (Conversational Prompt Engineering) to discover details for: ${JSON.stringify(sanitizeInput(input))}. Ask 3 high-signal questions with simple 'Quick Choice' options.`,
    config: {
      systemInstruction: `CPE Discovery Engine. ${simpleInstruction}`,
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
  const simpleInstruction = input.isSimpleMode ? "Categories must be grounded and non-technical." : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Apply Step-Back Prompting to find the strategic principles for: ${JSON.stringify(sanitizeInput(input))}. Suggest 3 choice categories.`,
    config: {
      systemInstruction: `Strategic Planner. ${simpleInstruction}`,
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
  const simpleInstruction = input.isSimpleMode ? "Output a simple guide, but use advanced internal logic." : "";

  const parts: any[] = [{ text: `SYNTHESIZE FINAL BLUEPRINT. APPLY RODES, CoD, AND XML STRUCTURING FOR: ${JSON.stringify(sanitizeInput(input))}` }];
  
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
    contents: { parts: [{ text: `A professional 3D design render of: ${prompt}. Clean, high quality, cinematic.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
