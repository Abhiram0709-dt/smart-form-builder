import { useState } from "react";

import { api, saveAuthSession } from "../../services/api";
import type { AuthSession } from "../../types";

type AuthPanelProps = {
  onAuthenticated: (session: AuthSession) => void;
};

type AuthMode = "login" | "signup";

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    const normalizedName = name.trim();

    if (!normalizedEmail || !password.trim() || (isSignup && !normalizedName)) {
      setAuthError("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    setAuthError("");

    try {
      const authResponse = isSignup
        ? await api.signup({
            name: normalizedName,
            email: normalizedEmail,
            password,
          })
        : await api.login({
            email: normalizedEmail,
            password,
          });

      const session = saveAuthSession(authResponse);
      onAuthenticated(session);
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Smart Form Builder</h1>
        <p className="auth-subtitle">
          {isSignup
            ? "Create your account to build and analyze forms"
            : "Log in to access your forms and responses"}
        </p>

        <div className="auth-mode-toggle">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => {
              setMode("login");
              setAuthError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "is-active" : ""}
            onClick={() => {
              setMode("signup");
              setAuthError("");
            }}
          >
            Sign Up
          </button>
        </div>

        {isSignup ? (
          <label className="builder-label">
            Name
            <input
              className="filler-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </label>
        ) : null}

        <label className="builder-label">
          Email
          <input
            className="filler-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="builder-label">
          Password
          <input
            className="filler-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
          />
        </label>

        <button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
        </button>

        {authError ? <p className="field-error">{authError}</p> : null}
      </div>
    </div>
  );
}
