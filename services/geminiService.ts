
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

/**
 * MASTER PROMPT ARCHITECT ENGINE
 * Enhanced with multi-field synthesis and cross-platform logic.
 */
const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: World-Class Prompt Architect
TASK: Transform user parameters and visual shards into a high-performance AI prompt.

PLATFORM STRATEGIES:
- Gemini: Focus on role + objective. Natural flow.
- OpenAI: DELIMITERS ("""). Primary instruction at TOP. High constraint precision.
- Claude: XML Tags (<task>, <context>). Ask for step-by-step thinking.
- Llama: Explicit headers (### Task). Few-shot emphasis.

REQUIRED FIELD SYNTHESIS:
1. Incorporate FEW-SHOT EXAMPLES if provided to define output style.
2. Embed STATIC RESOURCES as truth sources.
3. Explicitly list CONSTRAINTS/PITFALLS as negative prompts.
4. Align TONE & PERSONA for audience resonance.

OUTPUT:
Return a JSON object with:
- FINAL_PROMPT: The optimized string.
- NOTES_FOR_HUMAN_PROMPT_ENGINEER: Bulleted choices.
- VISUAL_INSPIRATION_PROMPT: A render prompt for the outcome.
`;

export const generateArchitectPrompt = async (input: PromptInput): Promise<PromptOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = input.reasoning_visibility === 'detailed' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const textPart = {
    text: `
      target_AI: ${input.target_AI}
      high_level_goal: ${input.high_level_goal}
      task_type: ${input.task_type}
      domain_context: ${input.domain_context}
      user_persona: ${input.user_persona}
      audience_persona: ${input.audience_persona || 'Standard'}
      tone_style: ${input.tone_style}
      output_format: ${input.output_format}
      length_and_depth: ${input.length_and_depth}
      reasoning_visibility: ${input.reasoning_visibility}
      language: ${input.language}
      few_shot_examples: ${input.few_shot_examples || 'None'}
      constraints_and_pitfalls: ${input.constraints_and_pitfalls || 'None'}
      static_resources: ${input.static_resources || 'None'}
    `
  };

  const parts: any[] = [textPart];
  if (input.base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: input.base64Image.split(',')[1] || input.base64Image
      }
    });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
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

export const magicFillMetaInputs = async (description: string, language: string, base64Image?: string): Promise<Partial<PromptInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: `Map this seed into architectural parameters: "${description}". Language: ${language}.` }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(',')[1] || base64Image
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: "Extract: user_persona, audience_persona, task_type, tone_style, output_format, constraints_and_pitfalls, domain_context, length_and_depth. Be highly technical.",
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
    contents: { parts: [{ text: `Hyper-realistic professional visualization of the prompt's final output: ${prompt}` }] },
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
    contents: `Commercial Kit for: "${goal}". Source: "${prompt}". Language: ${language}.`,
    config: {
      systemInstruction: "You are an Elite CMO. Generate highly conversion-optimized Social Ad copy, a Landing Page structure, and a 3-part Email drip campaign in JSON format.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          social_ads: { type: Type.STRING },
          landing_page: { type: Type.STRING },
          email_sequence: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};
