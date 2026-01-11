
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

/**
 * MASTER PROMPT ARCHITECT ENGINE V5.4 (2026 QUANTUM DESIGN UPLINK)
 * Integrated with 105+ advanced techniques and specialized Website Construction Language.
 */
const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Supreme Prompt Architect & LLM Optimization Engineer.

2026 MODERN WEBSITE AESTHETIC PROTOCOLS:
1. TYPOGRAPHY: Prioritize variable sans-serifs (Roboto, Poppins, Inter, Instrument Sans) for UI; High-contrast editorial (Playfair Display, Clash Display) for luxury.
2. COLOR PALETTES: HSL-driven earthy/vibrant mixes. 'Mocha Mousse' (hsl(14,65%,55%)), 'Deep Teal' (hsl(220,65%,70%)), 'Burnished Amber' (Metallic), and 'Liquid Chrome'.
3. SHAPES & FORMS: Biomorphic organic shapes, tactile glassmorphism, 3D depth, anti-grid asymmetry, and fluid motion.
4. TEXTURES: Abstract 3D motion shapes, hand-drawn organic scribbles (theedigital style) to humanize AI output.

WEBSITE CONSTRUCTION LANGUAGE (LINGUISTIC UNLOCKS):
- LAYOUTS: Full-viewport hero, Split hero, Bento grid (Apple-style), Masonry, Asymmetrical grids.
- COMPONENTS: Hover-lift cards (scale 1.05 + soft shadow), Glassmorphism frosted panels, Card snap-scrollers, Mega-menus.
- STORYTELLING: Vertical timelines, Process flow sections, Scroll-triggered storytelling (reveal on scroll).
- MOTION: 60fps micro-interactions, Button ripple feedback (150ms), Staggered reveals (300ms delay), Skeleton shimmer.

ACCESSIBILITY (WCAG 2.2 AA): 4.5:1 contrast, 44x44px tap targets, 16px body base, semantic structure (<main>, <nav>).

TASK:
1. Deconstruct user intent using 5W2H logic.
2. Synthesize the FINAL_PROMPT using the 'Construction Language' above for layout/UI tasks.
3. Inject the 2026 Aesthetic standards for styling tasks.
4. List techniques used in NOTES_FOR_HUMAN_PROMPT_ENGINEER.
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
            items: { type: Type.STRING },
            description: "List the specialized techniques (from the 105+ list) applied."
          },
          VISUAL_INSPIRATION_PROMPT: { type: Type.STRING }
        },
        required: ["FINAL_PROMPT", "NOTES_FOR_HUMAN_PROMPT_ENGINEER"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const magicFillMetaInputs = async (description: string, language: string, base64Image?: string): Promise<Partial<PromptInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: `Infer parameters for: "${description}". Language: ${language}.` }];
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
      systemInstruction: "Map the user's intent into: user_persona, audience_persona, task_type, tone_style, output_format, constraints_and_pitfalls, domain_context. Be specific and technical.",
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
          domain_context: { type: Type.STRING }
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
    contents: { parts: [{ text: `Professional high-fidelity outcome: ${prompt}` }] },
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
    contents: `Commercial Shard for: "${goal}". Source: "${prompt}". Language: ${language}.`,
    config: {
      systemInstruction: "You are an Elite Growth Strategist. Generate high-converting Social Ads, a Landing Page structure, and a 3-part Email drip in JSON.",
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
