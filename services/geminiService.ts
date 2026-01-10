
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Expert Prompt Architect
TASK: Design high-performance, ready-to-paste prompts for various AI models based on structured input.

CORE BEHAVIOR:
1. Infer Platform-Specific Strategy based on 'target_AI':
   - Gemini / Vertex / Workspace: Natural, conversational language. Explicitly include Persona, Task, Context, and Format.
   - OpenAI / ChatGPT / o-series: Clear instructions at the top. Delimit context with triple quotes (""").
   - Claude (Anthropic): Structured roles, XML-like tags (e.g., <context>), and permission to "think step by step".
   - Llama / Open Source: Extremely explicit and structured. Avoid compression. Use simple delimiters like "###".
   - Default: Generic structure (Role -> Task -> Context -> Constraints -> Format -> Step-by-step).

2. Design Prompt Structure:
   - A single text block containing: Role Declaration, Primary Instruction (Goal, Type, Depth), Context (Domain & Resources), Constraints & Quality (Positive instructions), and Reasoning (tuned by 'reasoning_visibility').

3. Apply Technique Selection:
   - Reasoning/Planning: Use chain-of-thought hints.
   - Extraction/Transformation: Use clear schemas and few-shot examples.
   - Creative: Specify style, audience, and variations.
   - Code: Use leading tokens and request comments/tests.

4. Enforce Clarity & Brevity: Use concise, unambiguous sentences. No fluff.

OUTPUT FORMAT (Strict JSON):
{
  "FINAL_PROMPT": "The fully composed prompt string",
  "NOTES_FOR_HUMAN_PROMPT_ENGINEER": ["Bullet 1 explaining choice", "Bullet 2..."],
  "VISUAL_INSPIRATION_PROMPT": "A prompt for an image generator (like DALL-E/Midjourney) to visualize the result/context"
}
`;

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      TARGET_AI: ${input.target_AI}
      GOAL: ${input.high_level_goal}
      TASK_TYPE: ${input.task_type}
      CONTEXT: ${input.domain_context}
      USER_PERSONA: ${input.user_persona}
      AUDIENCE_PERSONA: ${input.audience_persona || 'Not specified'}
      TONE_STYLE: ${input.tone_style}
      OUTPUT_FORMAT: ${input.output_format}
      LENGTH_DEPTH: ${input.length_and_depth}
      REASONING: ${input.reasoning_visibility}
      FEW_SHOT: ${input.few_shot_examples || 'None'}
      CONSTRAINTS: ${input.constraints_and_pitfalls || 'Standard quality'}
      RESOURCES: ${input.static_resources || 'None'}
      LANGUAGE: ${input.language}
    `,
    config: {
      systemInstruction: MASTER_ARCHITECT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          FINAL_PROMPT: { type: Type.STRING },
          NOTES_FOR_HUMAN_PROMPT_ENGINEER: { type: Type.ARRAY, items: { type: Type.STRING } },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING }
        },
        required: ["FINAL_PROMPT"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to parse prompt architecture JSON.");
  }
};

export const generateMarketingKit = async (prompt: string, goal: string, language: string): Promise<MarketingKit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this generated prompt: "${prompt}" and original goal: "${goal}", create a Marketing Kit in ${language}.`,
    config: {
      systemInstruction: `You are a Growth Marketer. Return JSON with: social_ads, landing_page, email_sequence, video_script, audio_script.`,
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

export const magicFillMetaInputs = async (description: string, language: string): Promise<Partial<PromptInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: "${description}". Language: ${language}.`,
    config: {
      systemInstruction: "Break down this task into prompt engineering parameters. Return JSON matching the PromptInput structure.",
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
  return response.text || "";
};

export const generateVisualImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Professional, clean, futuristic product visual: ${prompt}` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
};
