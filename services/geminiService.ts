
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Expert Prompt Architect
GOAL: Design high-performance, ready-to-paste prompts for various AI platforms.

CORE BEHAVIORS:
1. PLATFORM STRATEGIES:
   - Gemini: Persona, Task, Context, Format. Natural language. Multi-modal hints.
   - OpenAI (ChatGPT/o-series): Instructions at TOP. Delimiters ("""). Specific length/format.
   - Claude: Roles, XML tags (<context>, <task>). Explicit "Think step-by-step".
   - Llama/Open Source: High structure, simple delimiters (###), few-shot emphasis.
   - Others (Cohere, Copilot): Clear roles, numbered instructions, explicit schemas.

2. STRUCTURE:
   - Role declaration
   - Primary instruction
   - Context section
   - Constraints & Quality (Positive instructions)
   - Reasoning Section (Hidden/Brief/Detailed based on input)

3. TECHNIQUES:
   - Planning/Reasoning -> Chain of Thought.
   - Creative -> Style/Audience focus.
   - Data -> Grounding/RAG instructions.

OUTPUT REQUIREMENTS (Strict JSON):
{
  "FINAL_PROMPT": "A single, fully composed prompt string starting with 'FINAL_PROMPT:'",
  "NOTES_FOR_HUMAN_PROMPT_ENGINEER": ["Bullet 1 explaining choice", "Bullet 2 explaining platform-specific technique..."],
  "VISUAL_INSPIRATION_PROMPT": "A prompt for gemini-2.5-flash-image to visualize the UI/Outcome"
}
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
      audience_persona: ${input.audience_persona || 'Unspecified'}
      tone_style: ${input.tone_style}
      output_format: ${input.output_format}
      length_and_depth: ${input.length_and_depth}
      reasoning_visibility: ${input.reasoning_visibility}
      few_shot_examples: ${input.few_shot_examples || 'None'}
      constraints_and_pitfalls: ${input.constraints_and_pitfalls || 'None'}
      static_resources: ${input.static_resources || 'None'}
      language: ${input.language}
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

  return JSON.parse(response.text || "{}");
};

export const magicFillMetaInputs = async (description: string, language: string): Promise<Partial<PromptInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze: "${description}". Language: ${language}.`,
    config: {
      systemInstruction: "Map this task to PromptInput parameters: user_persona, audience_persona, task_type, tone_style, output_format, constraints_and_pitfalls, domain_context, length_and_depth.",
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
    contents: { parts: [{ text: `Professional digital art, clean UI aesthetic: ${prompt}` }] },
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
    contents: `KIT_REQUEST: "${goal}". PROMPT_REF: "${prompt}". Language: ${language}.`,
    config: {
      systemInstruction: "You are a CMO. Generate a full marketing launch kit. Return JSON with: social_ads, landing_page, email_sequence, video_script, audio_script.",
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
