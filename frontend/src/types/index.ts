export type QuestionType = "text" | "mcq" | "checkbox" | "dropdown";

export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: Option[];
}

export interface Form {
  id?: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface FormList {
  total: number;
  items: Form[];
}

export type AnswerValue = string | string[];

export interface Response {
  form_id: string;
  answers: Record<string, AnswerValue>;
}

export interface ResponseRead {
  id: string;
  form_id: string;
  answers: Record<string, AnswerValue>;
  submitted_at: string;
}

export interface ResponseList {
  form_id: string;
  total: number;
  items: ResponseRead[];
}

export interface ValidationError {
  question_id: string;
  code: string;
  message: string;
}

export interface OptionAnalytics {
  id: string;
  label: string;
  count: number;
}

export interface QuestionAnalytics {
  question_id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  total_answered: number;
  unanswered_count: number;
  options: OptionAnalytics[];
  text_samples: string[];
}

export interface FormAnalytics {
  form_id: string;
  total_responses: number;
  generated_at: string;
  questions: QuestionAnalytics[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}