
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Multi-Disciplinary Strategist.

MISSION: Convert vague intent into industrial-grade blueprints and specialized implementation prompts.

PROMPT ENGINEERING PRINCIPLES (Apply these to FINAL_PROMPT):
1. RODES Framework: Include Role, Objective, Details, Examples, and Sense check.
2. Persona Design: Assign specific expert roles (e.g., "Act as a Senior Architect").
3. Chain of Thought: Explicitly use "Let's think step-by-step" to guide the target AI.
4. Specific Constraints: Use both positive instructions and a negative constraint checklist.
5. Structured Format: Demand responses in Markdown, JSON, or XML as appropriate.
6. Audience Adaption: Tailor the tone for the intended end-user.

CORE OUTPUTS:
- APP_BLUEPRINT: A structural "source of truth" including screens, logic, and flow.
- FINAL_PROMPT: A hyper-detailed instruction set designed for an expert AI (Gemini/GPT/Claude).
`;

const SIMPLE_MODE_SYSTEM_INSTRUCTION = `
IMPORTANT: THE USER IS NOT TECHNICAL. 
- Use simple words: 'Building Plan', 'Goal', 'Checklist', 'Instructions', 'Steps'.
- Avoid jargon: 'Synthesis', 'Logic Shards', 'Vector', 'Prompt Engineering'.
- Explain everything like a friendly helper for a community group or small business.
- When generating 'options' for questions, make them grounded, human-friendly, and very easy to understand.
`;

const sanitizeInput = (input: PromptInput) => {
  const { media_ref_base64, ...cleanInput } = input;
  return cleanInput;
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? SIMPLE_MODE_SYSTEM_INSTRUCTION : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Clarify this project: ${JSON.stringify(sanitizeInput(input))}. Ask 3 simple questions. For each question, provide 3-4 suggested answers (options) that the user can just click on.`,
    config: {
      systemInstruction: `You are a project helper. Find missing details. ${simpleInstruction}`,
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
              items: { type: Type.STRING },
              description: "A list of 3-4 simple buttons for the user."
            }
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
  const simpleInstruction = input.isSimpleMode ? SIMPLE_MODE_SYSTEM_INSTRUCTION : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on: ${JSON.stringify(sanitizeInput(input))}, suggest 3 strategic choice categories.`,
    config: {
      systemInstruction: `Strategic planner persona. ${simpleInstruction}`,
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
  const simpleInstruction = input.isSimpleMode ? SIMPLE_MODE_SYSTEM_INSTRUCTION : "";

  const parts: any[] = [{ text: `SYNTHESIZE FINAL BLUEPRINT AND AI PROMPT FOR: ${JSON.stringify(sanitizeInput(input))}` }];
  
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
          SUGGESTED_MODELS: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                model_name: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              }
            }
          }
        },
        required: ["FINAL_PROMPT", "APP_BLUEPRINT", "VISUAL_INSPIRATION_PROMPT"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `A clean, professional 3D render or photograph of: ${prompt}. High quality, cinematic lighting, modern aesthetic.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
