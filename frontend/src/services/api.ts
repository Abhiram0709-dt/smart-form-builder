import type {
  AuthResponse,
  AuthSession,
  Form,
  FormAnalytics,
  FormList,
  LoginPayload,
  Response,
  ResponseList,
  ResponseRead,
  SignupPayload,
} from "../types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "sfb_access_token";
const AUTH_USER_KEY = "sfb_auth_user";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

type ApiError = Error & {
  status: number;
  detail?: unknown;
};

function toApiError(status: number, detail: unknown, fallbackMessage: string): ApiError {
  let message = fallbackMessage;

  if (typeof detail === "string" && detail.trim()) {
    message = detail;
  }

  if (
    typeof detail === "object" &&
    detail !== null &&
    "detail" in detail &&
    typeof (detail as { detail?: unknown }).detail === "string"
  ) {
    message = (detail as { detail: string }).detail;
  }

  const error = new Error(message) as ApiError;
  error.status = status;
  error.detail = detail;
  return error;
}

function getStoredToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

function buildHeaders(includeJsonContentType: boolean): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  fallbackErrorMessage: string
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  let detail: unknown = null;

  try {
    detail = await response.json();
  } catch {
    detail = null;
  }

  if (!response.ok) {
    throw toApiError(response.status, detail, fallbackErrorMessage);
  }

  return detail as T;
}

function parseStoredUser(rawUser: string | null): AuthSession["user"] | null {
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as AuthSession["user"];
    if (!parsed?.id || !parsed?.email || !parsed?.name) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadAuthSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const token = getStoredToken();
  const user = parseStoredUser(window.localStorage.getItem(AUTH_USER_KEY));

  if (!token || !user) {
    return null;
  }

  return { token, user };
}

export function saveAuthSession(authResponse: AuthResponse): AuthSession {
  const session: AuthSession = {
    token: authResponse.access_token,
    user: authResponse.user,
  };

  if (isBrowser()) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  }

  return session;
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export const api = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    return requestJson<AuthResponse>(
      "/auth/signup",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "Failed to sign up"
    );
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return requestJson<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "Failed to log in"
    );
  },

  async listForms(): Promise<FormList> {
    return requestJson<FormList>(
      "/forms",
      {
        method: "GET",
        headers: buildHeaders(false),
      },
      "Failed to fetch forms"
    );
  },

  async getForm(formId: string): Promise<Form> {
    return requestJson<Form>(
      `/forms/${formId}`,
      {
        method: "GET",
        headers: buildHeaders(false),
      },
      "Form not found"
    );
  },

  async createForm(form: Form): Promise<Form> {
    return requestJson<Form>(
      "/forms",
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(form),
      },
      "Failed to create form"
    );
  },

  async getFormAnalytics(formId: string): Promise<FormAnalytics> {
    return requestJson<FormAnalytics>(
      `/forms/${formId}/analytics`,
      {
        method: "GET",
        headers: buildHeaders(false),
      },
      "Failed to fetch analytics"
    );
  },

  async submitResponse(responsePayload: Response): Promise<ResponseRead> {
    return requestJson<ResponseRead>(
      "/responses",
      {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(responsePayload),
      },
      "Failed to submit response"
    );
  },

  async getResponses(formId: string): Promise<ResponseList> {
    return requestJson<ResponseList>(
      `/responses/${formId}`,
      {
        method: "GET",
        headers: buildHeaders(false),
      },
      "Failed to fetch responses"
    );
  },
};
