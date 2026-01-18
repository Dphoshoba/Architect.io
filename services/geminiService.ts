import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Elite PhD Prompt Architect & Lead Strategist (Dr. Architect).
MISSION: Synthesize a "Hyper-Fidelity" production prompt by applying the most relevant strategic framework.

FRAMEWORKS KNOWLEDGE BASE:
1. Google's 5-Step: Task, Context, References, Evaluate, Iterate ("Thoughtfully Create Really Excellent Inputs").
2. Building Blocks: Persona + Task + Context + Format (Standard successful mental model).
3. TTCRFEI: Task, Tone, Context, References, Format, Engage, Iterate (Refined structural model).
4. Get/To/By: Strategic Creative (Get: Audience, To: Outcome/Action, By: Insight/Strategy).
5. ECIF: Mental Model (Expand ideas, Condense synthesis, Iterate variations, Finesse polishing).

SYNTHESIS PROTOCOL:
- Integrate all user-selected "Mastermind Refinements" (Typography, Color Blending, Framework Choice).
- Treat the LLM as a "Creative Director" or "Lead Collaborator".
- Use Natural Language, be Specific, be Concise, and make it a Conversation.
- Include specific instructions for Multimodality (Images/Sound/Video) if shards are provided.

Return ONLY a valid JSON object matching the PromptOutput schema.
`;

const cleanJsonResponse = (text: string | undefined) => {
  if (!text) return {};
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw new Error("Failed to parse AI response.");
  }
};

export const generateMastermindSuggestions = async (input: PromptInput): Promise<MastermindSuggestionCategory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const promptText = `
    CURRENT STATE: ${input.task_type} for ${input.prof_domain || input.web_type || 'General Domain'}.
    OBJECTIVE: ${input.high_level_goal}.
    
    Propose 3 categories of Mastermind refinements to reach PhD-level fidelity:
    1. Visual Brand DNA: Options for Font Hierarchies (Editorial Serif, Modern Sans) and Color Chromatics (Midnight Glow, SaaS Blue).
    2. Strategic Framework: Which framework (Google 5-Step, TTCRFEI, Get/To/By, ECIF) anchors this?
    3. Operational Nuance: Boardroom logic, Copywriter Finesse, or Research Assistant constraints.

    Return 3 categories, each with 3 distinct options.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are Dr. Architect PhD. Provide multiple-choice refinements to elevate a prompt to 'Mastermind' status.",
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

  return cleanJsonResponse(response.text);
};

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = input.reasoning_visibility === 'detailed' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const promptText = `
    FINAL MASTER SYNTHESIS:
    Goal: ${input.high_level_goal}
    Negative Matrix: ${input.negative_prompt || 'None'}
    Refinements Integrated: ${input.domain_context}
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: promptText,
    config: {
      systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: modelName.includes('pro') ? 16000 : 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          FINAL_PROMPT: { type: Type.STRING },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING },
          SUGGESTED_MODELS: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                model_name: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["model_name", "reasoning"]
            }
          }
        },
        required: ["FINAL_PROMPT", "VISUAL_INSPIRATION_PROMPT", "SUGGESTED_MODELS"]
      }
    }
  });

  return cleanJsonResponse(response.text);
};

export const generateVisualImage = async (prompt: string, model: 'flash' | 'pro' | 'imagen' = 'flash'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ text: `Polished Editorial Tech aesthetic: ${prompt}. Cinematic lighting, glassmorphism UI, grid background.` }] },
    config: { 
      imageConfig: { 
        aspectRatio: "16:9",
        imageSize: model === 'pro' ? "2K" : "1K"
      } 
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const generateMarketingKit = async (prompt: string, goal: string, language: string): Promise<MarketingKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesis kit for goal: "${goal}". Language: ${language}.`,
    config: {
      systemInstruction: "Generate strategic marketing assets including social ads, email sequences, and a visual style guide.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          social_ads: { type: Type.STRING },
          landing_page: { type: Type.STRING },
          email_sequence: { type: Type.STRING },
          visual_style_guide: { type: Type.STRING }
        },
        required: ["social_ads", "landing_page", "email_sequence", "visual_style_guide"]
      }
    }
  });
  return cleanJsonResponse(response.text);
};