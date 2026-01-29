
export type TargetAI = 
  | "Gemini 3 Flash"
  | "Gemini 3 Pro"
  | "Gemini 2.5 Flash"
  | "Gemini 2.5 Pro"
  | "ChatGPT o3-mini"
  | "ChatGPT o1"
  | "GPT-4o"
  | "Claude 3.5 Sonnet"
  | "DeepSeek R1"
  | "Nano Banana / Gemini 3 Pro"
  | "Generic";

export type ReasoningVisibility = "hidden" | "brief" | "detailed";

export type PlanType = "Starter" | "Professional" | "Enterprise";

export interface UserStatus {
  userId: string;
  plan: string;
  creditsRemaining: number;
  totalCredits: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  status: string;
  payload: any;
}

export interface ApiKey {
  id: string;
  key: string;
  label: string;
  created: number;
}

export interface SuggestedModel {
  model_name: string;
  reasoning: string;
}

export interface AppliedStrategy {
  name: string;
  description: string;
}

export interface MastermindSuggestionOption {
  label: string;
  description: string;
  technical_value: string;
}

export interface MastermindSuggestionCategory {
  category: string;
  reasoning: string;
  options: MastermindSuggestionOption[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  options?: string[];
}

export interface PromptInput {
  target_AI: TargetAI;
  high_level_goal: string;
  negative_prompt?: string;
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
  isSimpleMode?: boolean; 
  media_ref_base64?: string;
  media_type?: 'image' | 'video' | 'audio';
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
  SUGGESTED_MODELS?: SuggestedModel[];
  APP_BLUEPRINT?: string;
  APPLIED_STRATEGIES: AppliedStrategy[];
  COMMIT_MESSAGE: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: PromptInput;
  output: PromptOutput;
}
