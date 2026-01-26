
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Multi-Disciplinary Strategist.

MISSION: Convert vague intent into industrial-grade blueprints and specialized implementation prompts.

DOMAINS:
1. ENGINEERING: Systems architecture, mechanical design, software infrastructure, and technical constraints.
2. REAL ESTATE & DESIGN: House planning, interior design, structural flow, and aesthetic decorations.
3. ARTIST: Fine arts, digital illustration, conceptual DNA, and technique-driven specifications.
4. VISUAL & MOTION (IMAGE/VIDEO): High-fidelity prompting for cinematic and editorial visual synthesis.
5. WEBSITE & SAAS: UI/UX patterns, logic flows, and conversion psychology.

CORE OUTPUTS:
- APP_BLUEPRINT: The structural "source of truth."
- FINAL_PROMPT: A hyper-detailed instruction for an expert practitioner or specialized AI.
`;

const SIMPLE_MODE_SYSTEM_INSTRUCTION = `
IMPORTANT: THE USER IS NOT TECHNICAL. 
- DO NOT use words like: 'Synthesis', 'Architecture', 'Blueprint', 'Logic', 'Vector', 'Prompt', 'Shards', 'Parameters', 'Optimization', 'Model', 'Refinement'.
- DO use words like: 'Building Plan', 'Style', 'Goal', 'Checklist', 'Instructions', 'Look & Feel', 'Steps'.
- Explain everything like a friendly assistant helping a small business owner or a hobbyist.
- Keep all explanations extremely simple and grounded in the physical world.
- If they want an app, talk about "screens" and "buttons".
- If they want a house, talk about "layout" and "decor".
`;

/** 
 * Cleans the input to prevent sending massive base64 strings inside the text prompt 
 * which causes 400 errors.
 */
const sanitizeInput = (input: PromptInput) => {
  const { media_ref_base64, base64Image, ...cleanInput } = input;
  return cleanInput;
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? SIMPLE_MODE_SYSTEM_INSTRUCTION : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Help clarify this project: ${JSON.stringify(sanitizeInput(input))}. Ask 3 very simple questions. For EACH question, provide 3 suggested short answers (options) that a non-technical user might choose from.`,
    config: {
      systemInstruction: `You are a helpful project helper. Find out what details are needed to start. ${simpleInstruction}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            context: { type: Type.STRING, description: "A simple reason why this question matters." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Suggested quick answers for a non-technical user."
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
    contents: `Based on the goal and context: ${JSON.stringify(sanitizeInput(input))}, give me 3 categories of styles or choices the user needs to make.`,
    config: {
      systemInstruction: `You are a style and planning advisor. Provide clear categories of choices. ${simpleInstruction}`,
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

  const parts: any[] = [{ text: `FINALIZE PLAN FOR: ${JSON.stringify(sanitizeInput(input))}` }];
  
  // Multimodal part - Binary data goes here, NOT in the JSON above
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
          FINAL_PROMPT: { type: Type.STRING, description: "Detailed instructions for another AI or expert." },
          APP_BLUEPRINT: { type: Type.STRING, description: "The structured plan for the user." },
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
    contents: { parts: [{ text: `A clean, professional 3D render or photograph of: ${prompt}. High quality, cinematic lighting.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
