
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

/**
 * MASTER PROMPT ARCHITECT ENGINE
 * Implements the "Master Prompt Builder" specification.
 * Handles platform-specific strategies for Gemini, ChatGPT, Claude, and Llama.
 */
const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Expert Prompt Architect
TASK: Take structured input and transform it into a high-performance, ready-to-paste prompt.

PLATFORM-SPECIFIC STRATEGIES:
- Gemini: Use natural language. Structure: Persona, Task, Context, Format. Encourage follow-ups.
- OpenAI (ChatGPT/o-series): Instructions at TOP. Use triple-quotes (""") as delimiters. Specific schemas.
- Claude: Use structured roles. Clear sections. Explicit XML-like tags (e.g., <context>). Ask to "think step-by-step".
- Llama/Open Source: Extreme explicitness. Simple headers (### Task). Few-shot examples required.
- Generic: Role -> Task -> Context -> Constraints -> Format -> Step-by-step.

CONSTRUCTION GUIDELINES:
1. Build a SINGLE text block.
2. Logic: Persona + Goal + Context + Constraints + Reasoning Visibility.
3. Apply techniques: Chain-of-Thought for logic, Schemas for extraction, Tone for creative.
4. Brevity: Use concise, precise instructions (e.g., "3 bullets" instead of "short").

OUTPUT FORMAT:
Return a JSON object with:
- FINAL_PROMPT: The full specialized prompt string.
- NOTES_FOR_HUMAN_PROMPT_ENGINEER: 2-5 bullets explaining design choices.
- VISUAL_INSPIRATION_PROMPT: A description for an image generator.
`;

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = input.reasoning_visibility === 'detailed' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model,
    contents: `
      target_AI: ${input.target_AI}
      high_level_goal: ${input.high_level_goal}
      task_type: ${input.task_type}
      domain_context: ${input.domain_context}
      user_persona: ${input.user_persona}
      audience_persona: ${input.audience_persona || 'Not specified'}
      tone_style: ${input.tone_style}
      output_format: ${input.output_format}
      length_and_depth: ${input.length_and_depth}
      reasoning_visibility: ${input.reasoning_visibility}
      few_shot_examples: ${input.few_shot_examples || 'None'}
      constraints_and_pitfalls: ${input.constraints_and_pitfalls || 'None'}
      static_resources: ${input.static_resources || 'None'}
    `,
    config: {
      systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          FINAL_PROMPT: { type: Type.STRING },
          NOTES_FOR_HUMAN_PROMPT_ENGINEER: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING }
        },
        required: ["FINAL_PROMPT"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const magicFillMetaInputs = async (description: string, language: string): Promise<Partial<PromptInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract parameters for: "${description}". Language: ${language}.`,
    config: {
      systemInstruction: "Break down the user request into: user_persona, audience_persona, task_type, tone_style, output_format, constraints_and_pitfalls, domain_context, length_and_depth.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          user_persona: { type: Type.STRING },
          audience_persona: { type: Type.STRING },
          task_type: { type: Type.STRING },
          tone_style: { type: Type.STRING },
          output_format: { type: Type.STRING },
          constraints_and_pitfalls: { type: Type.STRING },
          domain_context: { type: Type.STRING },
          length_and_depth: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const testArchitectedPrompt = async (systemInstruction: string, userMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userMessage,
    config: { systemInstruction, temperature: 0.7 }
  });
  return response.text || "Simulation error.";
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `High-quality, conceptual, professional: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
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
    contents: `Launch Kit for: "${goal}". Based on: "${prompt}". Language: ${language}.`,
    config: {
      systemInstruction: "You are a Growth Marketer. Synthesize social ads, landing page copy, and an email sequence in JSON format.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          social_ads: { type: Type.STRING },
          landing_page: { type: Type.STRING },
          email_sequence: { type: Type.STRING },
          video_script: { type: Type.STRING },
          audio_script: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};
