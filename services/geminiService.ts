
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const ADVANCED_KNOWLEDGE_BASE = `
APPLY THESE ADVANCED ARCHITECTURES:
- RODES: Role, Objective, Details, Examples, Sense-check.
- Chain of Density (CoD): Maximize information density without increasing length.
- Chain of Verification (CoVe): Draft, verify facts via internal Q&A, then rewrite.
- Meta-Prompting: Use a conductor persona to orchestrate expert sub-roles.
- Context Engineering: Manage attention budget by removing low-signal tokens.
- Thinking Tags: Use <thinking> blocks to resolve logical dependencies.
- XML Structuring: Use tags like <context>, <rules>, and <blueprint> for strict boundary separation.
- Analogical Prompting: Identify similar established patterns before synthesizing new ones.
- Step-Back Prompting: Extract high-level principles before solving specific details.
- Reflexion: Self-critique the output to identify logical failures before final delivery.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Multi-Disciplinary Strategist.
MISSION: Convert vague intent into industrial-grade blueprints and specialized implementation prompts.

STRATEGY ENGINE INSTRUCTIONS:
1. Select the 3-5 most relevant strategies from the ADVANCED_KNOWLEDGE_BASE (RODES, CoD, CoVe, etc.) based on the user's project.
2. Structure the FINAL_PROMPT using high-fidelity RODES framework.
3. Use XML tags in the FINAL_PROMPT for machine-readable clarity.
4. If SIMPLE_MODE is active, translate high-level strategies into clear "Action Steps" for the user.

${ADVANCED_KNOWLEDGE_BASE}
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
    contents: `Clarify this project using CPE (Conversational Prompt Engineering): ${JSON.stringify(sanitizeInput(input))}. Ask 3 high-signal questions. For each question, provide 3-4 simple "Quick Choice" answers.`,
    config: {
      systemInstruction: `You are a project helper using CPE principles. Find missing details. ${simpleInstruction}`,
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
    contents: `Analyze using Multi-Perspective Prompting: ${JSON.stringify(sanitizeInput(input))}, suggest 3 strategic choice categories.`,
    config: {
      systemInstruction: `Strategic planner using Multi-Perspective frameworks. ${simpleInstruction}`,
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

  const parts: any[] = [{ text: `SYNTHESIZE FINAL BLUEPRINT. APPLY RODES AND CHAIN-OF-VERIFICATION FOR: ${JSON.stringify(sanitizeInput(input))}` }];
  
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
          FINAL_PROMPT: { type: Type.STRING, description: "Detailed XML-wrapped implementation prompt." },
          APP_BLUEPRINT: { type: Type.STRING, description: "Structured building plan." },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING },
          COMMIT_MESSAGE: { type: Type.STRING, description: "A professional GitHub commit message for this project." },
          APPLIED_STRATEGIES: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
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
    contents: { parts: [{ text: `A clean, professional 3D render of: ${prompt}. Cinematic lighting, 8k, industrial design.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
