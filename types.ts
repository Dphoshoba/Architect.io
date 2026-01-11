
export type TargetAI = 
  | "Gemini 2.0 Flash"
  | "Gemini 2.0 Pro"
  | "Gemini 1.5 Pro"
  | "ChatGPT o3-mini"
  | "ChatGPT o1"
  | "GPT-4o"
  | "Claude 3.5 Sonnet"
  | "Claude 3.5 Haiku"
  | "DeepSeek R1"
  | "DeepSeek V3"
  | "Grok 3"
  | "Sora"
  | "Nano Banana / Gemini 3 Pro"
  | "Adobe Firefly"
  | "Imagen 4"
  | "Canva"
  | "Llama 3.3"
  | "Llama 3.1"
  | "Qwen 2.5 Max"
  | "Mistral Large 2"
  | "Cohere Command R+"
  | "Generic";

export type ReasoningVisibility = "hidden" | "brief" | "detailed";

export interface PromptInput {
  target_AI: TargetAI;
  high_level_goal: string;
  task_type: string;
  domain_context: string;
  user_persona: string;
  audience_persona?: string;
  tone_style: string;
  output_format: string;
  length_and_depth: string;
  reasoning_visibility: ReasoningVisibility;
  language: string;
  visual_inspiration_mode: boolean;
  few_shot_examples?: string;
  constraints_and_pitfalls?: string;
  static_resources?: string;
  base64Image?: string; // Multi-modal context support
}

export interface MarketingKit {
  social_ads: string;
  landing_page: string;
  email_sequence: string;
  video_script: string;
  audio_script: string;
  visual_style_guide: string;
}

export interface PromptOutput {
  FINAL_PROMPT: string;
  NOTES_FOR_HUMAN_PROMPT_ENGINEER?: string[];
  VISUAL_INSPIRATION_PROMPT?: string;
  MARKETING_KIT?: MarketingKit;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: PromptInput;
  output: PromptOutput;
}

export type PlanType = "Starter" | "Architect" | "Agency";

export interface UserStatus {
  plan: PlanType;
  creditsRemaining: number;
  totalCredits: number;
  stripeCustomerId?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  payload: any;
}

export interface ApiKey {
  id: string;
  key: string;
  label: string;
  created: number;
}
