import { useEffect, useMemo, useState } from "react";

import { FormBuilder } from "./components/builder/FormBuilder";
import { FormFiller } from "./components/filler/FormFiller";
import { ResponsesDashboard } from "./components/responses/ResponsesDashboard";
import "./App.css";

function extractFormIdFromInput(rawValue: string): string {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(trimmedValue);

    const queryFormId = url.searchParams.get("formId")?.trim();
    if (queryFormId) {
      return queryFormId;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const maybePathFormId = pathParts[pathParts.length - 1]?.trim() ?? "";
    if (maybePathFormId && maybePathFormId !== "fill" && maybePathFormId !== "responses") {
      return maybePathFormId;
    }
  } catch {
    // Not a URL, treat as plain form id.
  }

  return trimmedValue;
}

export function App() {
  const [page, setPage] = useState<"home" | "builder" | "filler" | "responses">(
    "home"
  );
  const [formId, setFormId] = useState("");
  const isFillerPage = page === "filler";

  const normalizedFormId = useMemo(() => extractFormIdFromInput(formId), [formId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const deepLinkFormId = params.get("formId")?.trim();
    const mode = params.get("mode")?.trim();

    if (!deepLinkFormId) {
      return;
    }

    setFormId(deepLinkFormId);
    setPage(mode === "responses" ? "responses" : "filler");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if ((page === "filler" || page === "responses") && normalizedFormId) {
      params.set("formId", normalizedFormId);
      params.set("mode", page === "responses" ? "responses" : "fill");
    } else {
      params.delete("formId");
      params.delete("mode");
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [page, normalizedFormId]);

  const openFiller = () => {
    if (!normalizedFormId) {
      return;
    }

    setFormId(normalizedFormId);
    setPage("filler");
  };

  const openResponses = () => {
    if (!normalizedFormId) {
      return;
    }

    setFormId(normalizedFormId);
    setPage("responses");
  };
  return (
    <div className={isFillerPage ? "App app-chat-page" : "App"}>
      {isFillerPage ? null : (
        <header className="header">
          <h1>Smart Form Builder</h1>
        </header>
      )}

      {page === "home" && (
        <div className="home">
          <button type="button" onClick={() => setPage("builder")}>
            Create Form
          </button>

          <div className="home-fill-box">
            <input
              type="text"
              placeholder="Enter form ID or paste shared link"
              value={formId}
              onChange={(event) => setFormId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  openFiller();
                }
              }}
            />
            <button type="button" onClick={openFiller}>
              Fill Form
            </button>
            <button type="button" className="button-muted" onClick={openResponses}>
              View Responses
            </button>
            <p className="home-hint">
              Tip: shared links open automatically when pasted or opened directly.
            </p>
          </div>
        </div>
      )}

      {page === "builder" && <FormBuilder onBack={() => setPage("home")} />}

      {page === "filler" && (
        <FormFiller formId={normalizedFormId} onBack={() => setPage("home")} />
      )}

      {page === "responses" && (
        <ResponsesDashboard formId={normalizedFormId} onBack={() => setPage("home")} />
      )}
    </div>
  );
}

export default App;
