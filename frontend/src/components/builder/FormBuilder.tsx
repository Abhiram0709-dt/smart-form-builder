import { useEffect, useMemo, useState } from "react";

import { api } from "../../services/api";
import type { Form, Option, Question, QuestionType } from "../../types";
import { FormFiller } from "../filler/FormFiller";
import { QuestionEditor } from "./QuestionEditor";

type FormBuilderProps = {
  onBack: () => void;
};

type BuilderMode = "builder" | "preview";

const OPTION_TYPES: QuestionType[] = ["mcq", "checkbox", "dropdown"];

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyQuestion(): Question {
  return {
    id: createId("q"),
    type: "text",
    label: "",
    required: false,
    options: [],
  };
}

function createEmptyOption(index: number): Option {
  return {
    id: createId("opt"),
    label: `Option ${index + 1}`,
  };
}

function usesOptions(type: QuestionType): boolean {
  return OPTION_TYPES.includes(type);
}

export function FormBuilder({ onBack }: FormBuilderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const [mode, setMode] = useState<BuilderMode>("builder");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedFormId, setSavedFormId] = useState("");
  const [copiedState, setCopiedState] = useState("");

  const draftForm = useMemo<Form>(
    () => ({
      title: title.trim(),
      description: description.trim() || undefined,
      questions,
    }),
    [title, description, questions]
  );

  const fillShareUrl = useMemo(() => {
    if (!savedFormId) {
      return "";
    }

    if (typeof window === "undefined") {
      return `?mode=fill&formId=${encodeURIComponent(savedFormId)}`;
    }

    return `${window.location.origin}${window.location.pathname}?mode=fill&formId=${encodeURIComponent(
      savedFormId
    )}`;
  }, [savedFormId]);

  const responsesShareUrl = useMemo(() => {
    if (!savedFormId) {
      return "";
    }

    if (typeof window === "undefined") {
      return `?mode=responses&formId=${encodeURIComponent(savedFormId)}`;
    }

    return `${window.location.origin}${window.location.pathname}?mode=responses&formId=${encodeURIComponent(
      savedFormId
    )}`;
  }, [savedFormId]);

  useEffect(() => {
    if (!copiedState) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setCopiedState("");
    }, 2200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [copiedState]);

  const copyShareLink = async (linkText: string, label: string) => {
    if (!linkText) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkText);
      } else {
        const tempInput = document.createElement("textarea");
        tempInput.value = linkText;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      setCopiedState(`${label} copied`);
    } catch {
      setCopiedState("Copy failed. Please copy manually.");
    }
  };

  const openShareLink = (linkText: string) => {
    if (!linkText || typeof window === "undefined") {
      return;
    }

    window.open(linkText, "_blank", "noopener,noreferrer");
  };

  const handleAddQuestion = () => {
    setQuestions((previous) => [...previous, createEmptyQuestion()]);
  };

  const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question
      )
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((previous) =>
      previous.filter((question) => question.id !== questionId)
    );
  };

  const handleMoveQuestion = (questionId: string, direction: "up" | "down") => {
    setQuestions((previous) => {
      const currentIndex = previous.findIndex((question) => question.id === questionId);
      if (currentIndex < 0) {
        return previous;
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const reordered = [...previous];
      const [movedQuestion] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, movedQuestion);
      return reordered;
    });
  };

  const handleTypeChange = (questionId: string, nextType: QuestionType) => {
    setQuestions((previous) =>
      previous.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        if (!usesOptions(nextType)) {
          return { ...question, type: nextType, options: [] };
        }

        if (question.options.length === 0) {
          return {
            ...question,
            type: nextType,
            options: [createEmptyOption(0)],
          };
        }

        return {
          ...question,
          type: nextType,
        };
      })
    );
  };

  const handleAddOption = (questionId: string) => {
    setQuestions((previous) =>
      previous.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        return {
          ...question,
          options: [...question.options, createEmptyOption(question.options.length)],
        };
      })
    );
  };

  const handleUpdateOption = (
    questionId: string,
    optionId: string,
    nextLabel: string
  ) => {
    setQuestions((previous) =>
      previous.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option) =>
            option.id === optionId ? { ...option, label: nextLabel } : option
          ),
        };
      })
    );
  };

  const handleDeleteOption = (questionId: string, optionId: string) => {
    setQuestions((previous) =>
      previous.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        return {
          ...question,
          options: question.options.filter((option) => option.id !== optionId),
        };
      })
    );
  };

  const validateBeforeSave = (): string | null => {
    if (!draftForm.title) {
      return "Form title is required.";
    }

    if (draftForm.questions.length === 0) {
      return "Add at least one question before saving.";
    }

    for (let index = 0; index < draftForm.questions.length; index += 1) {
      const question = draftForm.questions[index];
      if (!question.label.trim()) {
        return `Question ${index + 1} needs a label.`;
      }

      if (usesOptions(question.type)) {
        if (question.options.length === 0) {
          return `Question ${index + 1} needs at least one option.`;
        }

        if (question.options.some((option) => !option.label.trim())) {
          return `Question ${index + 1} has an empty option label.`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateBeforeSave();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSavedFormId("");
    setCopiedState("");

    try {
      const savedForm = await api.createForm(draftForm);
      setSavedFormId(savedForm.id ?? "");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save form. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="builder-shell">
      <div className="builder-top-row">
        <button type="button" onClick={onBack}>
          Back
        </button>

        <div className="mode-toggle">
          <button
            type="button"
            className={mode === "builder" ? "is-active" : ""}
            onClick={() => setMode("builder")}
          >
            Builder View
          </button>
          <button
            type="button"
            className={mode === "preview" ? "is-active" : ""}
            onClick={() => setMode("preview")}
            disabled={questions.length === 0}
          >
            Preview View
          </button>
        </div>
      </div>

      {mode === "builder" ? (
        <>
          <h2>Create Form</h2>

          <label className="builder-label">
            Form Title
            <input
              className="filler-input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Product Feedback"
            />
          </label>

          <label className="builder-label">
            Description
            <textarea
              className="filler-input"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <div className="question-list">
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                canMoveUp={index > 0}
                canMoveDown={index < questions.length - 1}
                onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                onTypeChange={(nextType) => handleTypeChange(question.id, nextType)}
                onDelete={() => handleDeleteQuestion(question.id)}
                onMoveUp={() => handleMoveQuestion(question.id, "up")}
                onMoveDown={() => handleMoveQuestion(question.id, "down")}
                onAddOption={() => handleAddOption(question.id)}
                onUpdateOption={(optionId, nextLabel) =>
                  handleUpdateOption(question.id, optionId, nextLabel)
                }
                onDeleteOption={(optionId) =>
                  handleDeleteOption(question.id, optionId)
                }
              />
            ))}
          </div>

          <div className="builder-actions">
            <button type="button" className="button-muted" onClick={handleAddQuestion}>
              Add Question
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Form"}
            </button>
          </div>

          {saveError ? <p className="field-error">{saveError}</p> : null}
          {savedFormId ? (
            <div className="saved-share-block">
              <p className="success-text">Saved. Form ID: {savedFormId}</p>

              <div className="share-row">
                <label className="share-label" htmlFor="fill-share-link">
                  Fill Link
                </label>
                <input
                  id="fill-share-link"
                  className="filler-input share-input"
                  type="text"
                  readOnly
                  value={fillShareUrl}
                />
                <div className="share-actions">
                  <button
                    type="button"
                    className="button-muted"
                    onClick={() => void copyShareLink(fillShareUrl, "Fill link")}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="button-muted"
                    onClick={() => openShareLink(fillShareUrl)}
                  >
                    Open
                  </button>
                </div>
              </div>

              <div className="share-row">
                <label className="share-label" htmlFor="responses-share-link">
                  Responses Link
                </label>
                <input
                  id="responses-share-link"
                  className="filler-input share-input"
                  type="text"
                  readOnly
                  value={responsesShareUrl}
                />
                <div className="share-actions">
                  <button
                    type="button"
                    className="button-muted"
                    onClick={() => void copyShareLink(responsesShareUrl, "Responses link")}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="button-muted"
                    onClick={() => openShareLink(responsesShareUrl)}
                  >
                    Open
                  </button>
                </div>
              </div>

              {copiedState ? <p className="copy-feedback-text">{copiedState}</p> : null}
            </div>
          ) : null}
        </>
      ) : (
        <div className="preview-shell">
          <h2>Live Preview</h2>
          <p className="form-description">
            Conversational preview of the current draft form.
          </p>
          <FormFiller
            previewMode
            previewForm={draftForm}
            onBack={() => setMode("builder")}
          />
        </div>
      )}
    </div>
  );
}
