
export type TargetAI = 
  | "Gemini 2.0" 
  | "ChatGPT o3" 
  | "Claude 3.5" 
  | "Llama 3.1" 
  | "Mistral" 
  | "Cohere" 
  | "Copilot" 
  | "Generic";

export type ReasoningVisibility = "hidden" | "brief" | "detailed";

export interface BrandIdentity {
  voice: string;
  valueProp: string;
}

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
}

export interface MarketingKit {
  social_ads: string;
  landing_page: string;
  email_sequence: string;
  video_script: string;
  audio_script: string;
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
