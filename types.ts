
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

export type ProjectCategory = 
  | "ENGINEERING" 
  | "REAL_ESTATE" 
  | "INTERIOR_DESIGN" 
  | "ART_CREATIVE" 
  | "VISUAL_ASSET"
  | "WEB_DEVELOPMENT"
  | "BUSINESS_WEB"
  | "GENERIC";

// Adding missing types for Backend and Convex services
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

export interface CategoryConfig {
  scale?: string;
  material?: string;
  industry?: string;
  propertyType?: string;
  aesthetic?: string;
  lighting?: string;
  medium?: string;
  era?: string;
  resolution?: string;
  framework?: string;
  language?: string;
  stackType?: string;
  apiType?: string;
  businessSector?: string;
  conversionGoal?: string;
  brandVoice?: string;
  siteType?: string;
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
  category?: ProjectCategory;
  config?: CategoryConfig;
  matrix_selections?: Record<string, string>;
}

export interface PromptOutput {
  FINAL_PROMPT: string;
  VISUAL_INSPIRATION_PROMPT?: string;
  APP_BLUEPRINT?: string;
  APPLIED_STRATEGIES: AppliedStrategy[];
  COMMIT_MESSAGE: string;
}
