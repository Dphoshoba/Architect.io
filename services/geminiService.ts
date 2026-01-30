
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const ADVANCED_PROMPTING_KNOWLEDGE = `
ADVANCED STRATEGIES (150+ SHARDS):
- RODES: Role, Objective, Details, Examples, Sense-check (PRIMARY ARCHITECTURE).
- Chain of Density: Maximize entity density in narrative summaries.
- Chain of Verification: Self-correct facts through internal Q&A loops.
- XML Structuring: Use machine-readable tags for boundary control.
- Step-Back Prompting: Identify high-level principles before details.
- Conversational Prompt Engineering (CPE): Use clarifying discovery questions.
- Chiaroscuro Lighting Architecture: Specifically apply high-contrast visual descriptions.
- Attention Budgeting: Remove low-signal tokens from context.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Biblical Narrative Specialist.
MISSION: Convert vague intent into high-fidelity implementation prompts and structural blueprints.

EXECUTIVE INSTRUCTIONS:
1. Internalize the ADVANCED_PROMPTING_KNOWLEDGE.
2. Structure the FINAL_PROMPT using strictly enforced RODES framework inside XML tags.
3. For narratives, integrate "Chiaroscuro Lighting Architecture" to ensure high-contrast, dramatic visual fidelity.
4. Output a specialized COMMIT_MESSAGE matching the user's requested high-fidelity style.

${ADVANCED_PROMPTING_KNOWLEDGE}
`;

const sanitizeInput = (input: PromptInput) => {
  const { media_ref_base64, ...cleanInput } = input;
  return cleanInput;
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? "Use simple words." : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Discovery Phase: CPE Analysis for ${JSON.stringify(sanitizeInput(input))}. Ask 3 high-signal questions with Quick Choice options.`,
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Step-Back Strategic Analysis for ${JSON.stringify(sanitizeInput(input))}. Suggest 3 choice categories.`,
    config: {
      systemInstruction: `Strategic planner.`,
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
  const parts: any[] = [{ text: `SYNTHESIZE QUANTUM BLUEPRINT. APPLY RODES, CoD, AND CHIAROSCURO LIGHTING FOR: ${JSON.stringify(sanitizeInput(input))}` }];
  
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
  return JSON.parse(response.text);
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `A high-fidelity architectural synthesis render with chiaroscuro lighting: ${prompt}. Cinematic masterpiece, 8k.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
