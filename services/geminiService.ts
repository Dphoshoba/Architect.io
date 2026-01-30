
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
- Chiaroscuro Lighting Architecture: Apply high-contrast visual descriptions ONLY if the task is creative/visual.
- Attention Budgeting: Remove low-signal tokens from context to maximize focus.
- Delimiters: Use strictly defined XML tags for component separation.
`;

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Universal Product Architect & Advanced Prompt Engineering Engine.
MISSION: Convert user intent into high-fidelity, industrial-strength implementation prompts and structural blueprints.

STRICT STATELESS ISOLATION (DOMAIN MIRRORING):
1. You have NO memory of previous sessions. 
2. Identify the industry of the current 'high_level_goal' (e.g., SaaS, Engineering, Real Estate).
3. MIRROR THE DOMAIN: Use vocabulary, metaphors, and examples EXCLUSIVELY from that industry.
4. PROHIBITED ANALOGIES: Unless specifically requested, never use analogies related to: wine, religion, biblical narratives, serpents, renaissance art, or alchemy.
5. If the goal is technical, keep the blueprint and prompt strictly technical.

EXECUTIVE INSTRUCTIONS:
- Structure everything using the RODES framework.
- Provide a succinct, professional GIT COMMIT message.

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
    contents: `Discovery Phase Analysis for: "${input.high_level_goal}". Generate 3 high-signal domain-specific questions.`,
    config: {
      systemInstruction: `Project discovery assistant. ${simpleInstruction} Identify missing constraints. STICK 100% TO THE USER'S DOMAIN. No irrelevant metaphors. Mirror the user's industry terminology perfectly.`,
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
    contents: `Strategic Refinement Matrix for Objective: "${input.high_level_goal}". Suggested industry context: ${input.task_type}.`,
    config: {
      systemInstruction: `Strategic planner. YOU ARE STATELESS. Mirror the industry vocabulary. 
      - If building a Website: suggestions must be about SEO, UI/UX, Backend, and SaaS. 
      - If building Engineering: suggestions must be about modularity, hardware, and physics. 
      - FORBIDDEN THEMES: wine, biblical, religious, art-history, serpents, bronze.
      - Generate DYNAMIC HEADERS that sound professional for the specific domain.`,
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
  const parts: any[] = [{ text: `SYNTHESIZE QUANTUM BLUEPRINT. APPLY RODES. INDUSTRY: ${input.task_type}. GOAL: ${JSON.stringify(sanitizeInput(input))}` }];
  
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
    contents: { parts: [{ text: `A professional industrial/architectural render: ${prompt}. Cinematic masterpiece, high resolution, industrial aesthetics.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};
