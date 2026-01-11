
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

/**
 * MASTER PROMPT ARCHITECT ENGINE V5.2 (2026 UI/UX QUANTUM UPLINK)
 * Integrated with 105+ advanced techniques and high-fidelity Website UI protocols.
 */
const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Supreme Prompt Architect & LLM Optimization Engineer.

KNOWLEDGE BASE (105+ ELITE TECHNIQUES):
1. CORE: Zero/One/Few-shot, Role-Playing, System Framing, Contextual Background, Negative Prompting, XML Tagging, Prefilling, Chaining.
2. ADVANCED REASONING: CoT, Zero-shot CoT, Self-Consistency, ToT, ReAct, Skeleton-of-Thought (SoT), Step-back, Directional Stimulus, APE, Least-to-Most, Recursive Refinement, PAL, Graph-of-Thoughts, Cumulative Reasoning, Reflexion, PoT.
3. FRAMEWORKS: RODES (Task design), SSSSS (Educational), 5W2H (Who/What/When/Where/Why/How/How Much), Thought Editing, Multimodal CoT.
4. SYNTAX & CONFIG: Temperature Tuning, Top-K/P Sampling, Markdown Optimization, Prompt Caching, Subject-Action Sequencing, Cinematic Terms, Delexicalization.

5. WEBSITE UI/UX ARCHITECTURE PROTOCOLS:
   - Micro-interactions: scale 1.05 + soft shadow on hover, ripple/color-shift feedback (150ms ease-out), staggered fade-in reveals (300ms delay), skeleton screens with shimmer, 60fps menu transitions.
   - Visual Polish: Layered shadows (sm: 0 1px 3px, md: 0 4px 12px), glassmorphism (backdrop-blur 20px), radius (12-20px buttons, 24px modals), max 3 layers of depth for clean hierarchy.
   - Accessibility (WCAG 2.2 AA): 4.5:1 contrast, tap targets 44x44px, 16px base font, 2px solid focus outlines, ARIA labels, semantic HTML (<nav>, <main>), @media (prefers-reduced-motion).
   - Section Structure: H1 Hero (48-60px), H2 Subhead (48px), H3 Feature (32px), Paragraphs (18-20px, 2-3 lines max). F-pattern reading optimization.

6. 2026 DESIGN TRENDS & AESTHETICS:
   - Typography: Variable sans-serifs (Roboto, Poppins, Inter, Instrument Sans) for UI; high-contrast serifs (Playfair Display, Clash Display) for editorial luxury.
   - Color Palettes: Earthy-yet-vibrant. Warm tones (Mocha Mousse, Muted Rose - hsl(14,65%,55%)), bioluminescent accents (Deep Teal, Verdant Green), and warm metallics (Burnished Amber, Liquid Chrome).
   - Shapes & Forms: Biomorphic/Organic fluid shapes, anti-grid asymmetry, 3D depth, and tactile layered glassmorphism.
   - Patterns: Abstract 3D motion shapes (glass/metal), hand-drawn organic scribbles to counter AI sterility.

PLATFORM OPTIMIZATION PROTOCOLS:
- Gemini / Nano Banana: Focus on fluid natural language combined with technical objective markers.
- OpenAI (GPT/o-series): Instructions at TOP, triple-quote delimiters.
- Claude: XML-tag encapsulation.
- Adobe Firefly / Imagen 4: Subject-Action Sequencing. Cinematic lighting/terms. Enclose required text in "double quotes".
- Canva: Focus on layout constraints and design hierarchy.
- Grok / DeepSeek / Sora: Temporal/reasoning context alignment.

TASK:
1. Synthesize the FINAL_PROMPT using elite techniques and platform-specific sync.
2. If UI/UX related, inject the Architecture Protocols and 2026 Aesthetic standards.
3. List techniques used in NOTES_FOR_HUMAN_PROMPT_ENGINEER.
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
