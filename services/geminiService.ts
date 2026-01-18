import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit, MastermindSuggestionCategory } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World-class PhD Prompt Architect & Strategist.
MISSION: Synthesize a "Hyper-Fidelity" prompt using elite frameworks derived from Google's best practices.

FRAMEWORKS AVAILABLE (Select best fit based on context):
1. Google's 5-Step: Task, Context, References, Evaluate, Iterate.
2. Building Blocks: Persona + Task + Context + Format.
3. TTCRFEI: Task, Tone, Context, References, Format, Engage, Iterate.
4. Get/To/By: Strategic Creative (Get: Audience, To: Outcome, By: Insight/Strategy).
5. ECIF: Expand (Ideas), Condense (Synthesis), Iterate (Variations), Finesse (Polishing).

OUTPUT REQUIREMENTS:
- Integrate all selected "Mastermind Refinements" (Typography, Color Blending, Interaction Logic).
- Ensure the prompt treats the LLM as a "Creative Director" or "Lead Collaborator".
- Include specific instructions for Multimodality if images/files are provided.
- Recommend deployment targets based on Logic Depth vs Speed requirements.

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
    
    As Dr. Architect PhD, analyze this synthesis matrix. We are missing critical "Polished Editorial Tech" shards.
    Propose 3 categories of Mastermind refinements.
    1. Visual Brand DNA (Font Hierarchies, Color Blending/Chromatics).
    2. Strategic Framework (Which of the 5 frameworks should we anchor to?).
    3. Interaction Nuance (Boardroom questions, Focus group lenses, or Copywriter Finesse styles).

    Return 3 categories, each with 3 distinct choice-based options.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "You are a world-class PhD strategist. Identify gaps in a technical prompt and offer high-level multiple-choice refinements.",
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
    FINAL SYNTHESIS COMMAND:
    Goal: ${input.high_level_goal}
    Negative Matrix: ${input.negative_prompt || 'None'}
    Refinements Integrated: ${input.domain_context} (Mastermind choices)
    Framework Target: High-Fidelity Professional Collaborator.
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
    contents: { parts: [{ text: `Editorial polished technology render: ${prompt}. Grid background, glassmorphism elements.` }] },
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
    contents: `Collaborative kit for: "${goal}". Language: ${language}.`,
    config: {
      systemInstruction: "Create strategic marketing assets including social ads, landing page copy, and email sequences.",
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