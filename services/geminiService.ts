
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MastermindSuggestionCategory, InterviewQuestion } from "../types";

const ADVANCED_PROMPTING_KNOWLEDGE = `
ADVANCED STRATEGIES (150+ SHARDS):
- RODES: Role, Objective, Details, Examples, Sense-check (PRIMARY ARCHITECTURE).
- Chain of Density: Maximize entity density in narrative summaries.
- Chain of Verification: Self-correct facts through internal Q&A loops.
- XML Structuring: Use machine-readable tags for boundary control.
- Step-Back Prompting: Identify high-level principles before details.
- Conversational Prompt Engineering (CPE): Use clarifying discovery questions to remove ambiguity.
- Chiaroscuro Lighting Architecture: Specifically apply high-contrast visual descriptions, emphasizing "deep shadows" and "divine highlights."
- Attention Budgeting: Remove low-signal tokens from context to maximize focus.
- Delimiters: Use strictly defined XML tags or Markdown headers for component separation.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Advanced Prompt Engineering Engine.
MISSION: Convert user intent into high-fidelity, industrial-strength implementation prompts and structural blueprints.

STRICT CONTEXT ADHERENCE (DOMAIN MIRRORING):
1. You MUST derive all logic, themes, metaphors, and examples EXCLUSIVELY from the user's current 'high_level_goal'.
2. DOMAIN LOCK: If the goal is technical (Software, IoT, Engineering), you MUST NOT use religious, biblical, or classical art metaphors (e.g., no "divine", "biblical", "bronze serpents", "wine", "altars").
3. NEVER use default or cached examples. If building a SaaS, use SaaS terminology. If building a House, use Architectural terminology.
4. HALLUCINATION PREVENTION: Do not inject "Chiaroscuro" descriptions into technical code prompts unless it is a UI/Visual task.

EXECUTIVE INSTRUCTIONS:
1. Every output must be structured using the RODES framework.
2. Provide a succinct, professional GIT COMMIT message.

${ADVANCED_PROMPTING_KNOWLEDGE}
`;

const sanitizeInput = (input: PromptInput) => {
  const { media_ref_base64, ...cleanInput } = input;
  return cleanInput;
};

export const generateInterviewQuestions = async (input: PromptInput): Promise<InterviewQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simpleInstruction = input.isSimpleMode ? "Use simple words and avoid technical jargon." : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Discovery Phase Analysis for ${JSON.stringify(sanitizeInput(input))}. Provide 3 questions.`,
    config: {
      systemInstruction: `Project discovery assistant. ${simpleInstruction} Identify missing constraints. STICK STRICTLY TO THE USER'S DOMAIN: ${input.task_type || 'General'}. DO NOT use biblical, wine, or serpent examples. Mirror the user's industry.`,
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
    contents: `Strategic Refinement Matrix for Objective: "${input.high_level_goal}".`,
    config: {
      systemInstruction: `Strategic planner. STICK 100% TO THE USER OBJECTIVE. If the user is building a website, do NOT talk about "biblical superimposition" or "wine elementals". If they are building an app, use software metaphors. PROHIBITED TERMS: wine, biblical, serpent, bronze, encampment, renaissance, theological. Use pure industrial and design vocabulary relevant to the user input.`,
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
  const parts: any[] = [{ text: `SYNTHESIZE QUANTUM BLUEPRINT. APPLY RODES. DOMAIN: ${input.task_type}. OBJECTIVE: ${JSON.stringify(sanitizeInput(input))}` }];
  
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
    contents: { parts: [{ text: `A high-fidelity industrial/architectural render: ${prompt}. Cinematic, detailed, 8k.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
