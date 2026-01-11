
import { GoogleGenAI, Type } from "@google/genai";
import { PromptInput, PromptOutput, MarketingKit } from "../types";

/**
 * MASTER PROMPT ARCHITECT ENGINE V5.1 (UI/UX AUGMENTED)
 * Integrated with 105+ advanced techniques and specialized Website UI protocols.
 */
const MASTER_ARCHITECT_SYSTEM_PROMPT = `
ROLE: Supreme Prompt Architect & LLM Optimization Engineer.

KNOWLEDGE BASE (105+ ELITE TECHNIQUES):
1. CORE: Zero/One/Few-shot, Role-Playing, System Framing, Contextual Background, Negative Prompting, XML Tagging, Prefilling, Chaining.
2. ADVANCED REASONING: CoT, Zero-shot CoT, Self-Consistency, ToT, ReAct, Skeleton-of-Thought (SoT), Step-back, Directional Stimulus, APE, Least-to-Most, Recursive Refinement, PAL, Graph-of-Thoughts, Cumulative Reasoning, Reflexion, PoT.
3. FRAMEWORKS: RODES (Task design), SSSSS (Educational), 5W2H (Who/What/When/Where/Why/How/How Much), Thought Editing, Multimodal CoT.
4. SYNTAX & CONFIG: Temperature Tuning, Top-K/P Sampling, Markdown Optimization, Prompt Caching, Subject-Action Sequencing, Cinematic Terms, Delexicalization.
5. DOMAIN SCENARIOS: Game of 24, Kitchen Decision Making, Multi-Hop QA, LLM-as-a-Judge, Voxel Art Generation.

6. WEBSITE UI & UX DESIGN PROTOCOLS (SPECIALIZED):
   - Micro-interactions: Aim for 60fps smoothness. Use hover states (scale 1.05 + soft shadow), click feedback (ripple/150ms ease), staggered reveals (300ms delay), and skeleton shimmer.
   - Visual Polish: Layered shadows (sm: 0 1px 3px, md: 0 4px 12px), glassmorphism (backdrop-blur 20px), soft neumorphism, border-radius (12px buttons, 24px modals), and subtle glow effects.
   - Accessibility (WCAG 2.2 AA): Ensure 4.5:1 contrast, tap targets (min 44x44px), 16px base body font, keyboard focus outlines (2px solid), and prefers-reduced-motion support.
   - Section Structure: Conversion-focused hierarchy. H1 Hero (60px), H2 Action (48px), H3 Feature (32px). Paragraphs max 2-3 lines. F-pattern scannability with above-fold CTA.

PLATFORM OPTIMIZATION PROTOCOLS:
- Gemini / Nano Banana: Focus on fluid natural language instructions combined with specific objective markers. Leverage its high-reasoning multimodal capabilities.
- OpenAI (GPT/o-series): Place instructions at the TOP. Use triple-quote (""") delimiters.
- Claude: Use XML-like tags (e.g., <task>, <context>).
- Adobe Firefly / Imagen 4: Utilize "Subject-Action Sequencing." Specify technical lighting (e.g., "hard rim light"), cinematic terminology (e.g., "crane shot"), and artistic styles (e.g., "watercolor," "voxel art"). Enclose required text in "double quotes."
- Canva: Focus on layout constraints, design hierarchy, element positioning, and visual balance descriptions.
- Grok / DeepSeek / Sora: Follow their unique temporal, reasoning, or real-time context requirements.

TASK:
1. Deconstruct the user's intent using 5W2H logic.
2. Select a primary framework (e.g., Tree of Thoughts for complex logic, or RODES for task design).
3. Synthesize the FINAL_PROMPT using the selected platform's specific optimization protocols.
4. If the task is UI/UX related, apply the WEBSITE UI & UX DESIGN PROTOCOLS.
5. Include a list of techniques used in the NOTES_FOR_HUMAN_PROMPT_ENGINEER field.
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
