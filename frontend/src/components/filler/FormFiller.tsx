import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { api } from "../../services/api";
import type { AnswerValue, Form, Question } from "../../types";
import { QuestionCard } from "./QuestionCard";

type FormFillerProps = {
  formId?: string;
  onBack?: () => void;
  previewForm?: Form;
  previewMode?: boolean;
};

function isAnswerMissing(question: Question, answer: AnswerValue | undefined): boolean {
  if (!question.required) {
    return false;
  }

  if (question.type === "checkbox") {
    return !Array.isArray(answer) || answer.length === 0;
  }

  return typeof answer !== "string" || answer.trim().length === 0;
}

function optionLabel(question: Question, optionId: string): string {
  const foundOption = question.options.find((option) => option.id === optionId);
  return foundOption ? foundOption.label : optionId;
}

function formatAnswerForChat(question: Question, answer: AnswerValue | undefined): string {
  if (answer === undefined) {
    return "No answer";
  }

  if (question.type === "checkbox") {
    if (!Array.isArray(answer) || answer.length === 0) {
      return "No answer";
    }

    return answer.map((item) => optionLabel(question, item)).join(", ");
  }

  if (typeof answer !== "string" || answer.trim().length === 0) {
    return "No answer";
  }

  if (question.type === "mcq" || question.type === "dropdown") {
    return optionLabel(question, answer);
  }

  return answer;
}

export function FormFiller({
  formId,
  onBack,
  previewForm,
  previewMode = false,
}: FormFillerProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentFieldError, setCurrentFieldError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const chatThreadRef = useRef<HTMLDivElement | null>(null);
  const isPreview = previewMode || Boolean(previewForm);
  const shellClassName = isPreview
    ? "filler-shell"
    : "filler-shell filler-shell-fullscreen";

  useEffect(() => {
    if (isPreview) {
      setForm(previewForm ?? null);
      setLoading(false);
      setLoadError(previewForm ? "" : "Preview form is empty.");
      setAnswers({});
      setCurrentQuestionIndex(0);
      setCurrentFieldError("");
      setSubmitError("");
      setSubmitted(false);
      return;
    }

    if (!formId || !formId.trim()) {
      setForm(null);
      setLoading(false);
      setLoadError("Form ID is required.");
      return;
    }

    const safeFormId = formId.trim();
    let ignore = false;

    async function loadForm() {
      setLoading(true);
      setLoadError("");

      try {
        const loadedForm = await api.getForm(safeFormId);
        if (!ignore) {
          setForm(loadedForm);
          setAnswers({});
          setCurrentQuestionIndex(0);
          setCurrentFieldError("");
          setSubmitError("");
          setSubmitted(false);
        }
      } catch (error: unknown) {
        if (!ignore) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load form. Check the form ID and try again."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadForm();

    return () => {
      ignore = true;
    };
  }, [formId, isPreview, previewForm]);

  const currentQuestion = useMemo(() => {
    if (!form || form.questions.length === 0) {
      return null;
    }

    return form.questions[currentQuestionIndex] ?? null;
  }, [form, currentQuestionIndex]);

  const historyEntries = useMemo(() => {
    if (!form) {
      return [] as Array<{ question: Question; answer: AnswerValue | undefined }>;
    }

    return form.questions
      .slice(0, currentQuestionIndex)
      .map((question) => ({
        question,
        answer: answers[question.id],
      }));
  }, [form, currentQuestionIndex, answers]);

  useEffect(() => {
    const threadNode = chatThreadRef.current;
    if (!threadNode) {
      return;
    }

    threadNode.scrollTop = threadNode.scrollHeight;
  }, [currentQuestionIndex, answers, submitted]);

  const isLastQuestion =
    !!form && form.questions.length > 0 && currentQuestionIndex === form.questions.length - 1;

  const handleAnswerChange = (value: AnswerValue) => {
    if (!currentQuestion) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value,
    }));

    setCurrentFieldError("");
    setSubmitError("");
  };

  const handleBack = () => {
    setSubmitError("");
    setCurrentFieldError("");
    setCurrentQuestionIndex((previous) => Math.max(0, previous - 1));
  };

  const handleSubmit = async () => {
    if (!form) {
      return;
    }

    if (isPreview) {
      setSubmitted(true);
      return;
    }

    if (!form.id) {
      setSubmitError("Form must be saved before submitting responses.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await api.submitResponse({
        form_id: form.id,
        answers,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      const maybeError = error as {
        message?: string;
        detail?: {
          detail?: string;
          errors?: Array<{ question_id?: string; message?: string }>;
        };
      };

      const detailBlock = maybeError?.detail;
      const detailErrors = detailBlock?.errors ?? [];
      const questionError = detailErrors.find(
        (item) => item.question_id === currentQuestion?.id
      )?.message;

      setSubmitError(
        questionError ??
          detailBlock?.detail ??
          maybeError.message ??
          "Could not submit response."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!currentQuestion) {
      return;
    }

    const answer = answers[currentQuestion.id];

    if (isAnswerMissing(currentQuestion, answer)) {
      setCurrentFieldError("This question is required.");
      return;
    }

    setCurrentFieldError("");

    if (isLastQuestion) {
      await handleSubmit();
      return;
    }

    setCurrentQuestionIndex((previous) => previous + 1);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.shiftKey || isSubmitting || !currentQuestion) {
      return;
    }

    const targetElement = event.target as HTMLElement;
    const tagName = targetElement.tagName.toLowerCase();

    if (tagName === "textarea" || tagName === "select" || tagName === "button") {
      return;
    }

    event.preventDefault();
    void handleNext();
  };

  if (loading) {
    return <p>Loading form...</p>;
  }

  if (loadError) {
    return (
      <div className={shellClassName}>
        <p className="field-error">{loadError}</p>
        {onBack ? (
          <button type="button" onClick={onBack}>
            Back
          </button>
        ) : null}
      </div>
    );
  }

  if (!form) {
    return null;
  }

  if (submitted) {
    return (
      <div className={`${shellClassName} filler-status-screen`}>
        <h2>{form.title || "Untitled Form"}</h2>
        <p>
          {isPreview
            ? "Preview complete. Save this form to collect real responses."
            : "Thanks. Your response has been submitted."}
        </p>
        {onBack ? (
          <button type="button" onClick={onBack}>
            {isPreview ? "Back to Builder" : "Back to Home"}
          </button>
        ) : null}
      </div>
    );
  }

  if (form.questions.length === 0) {
    return (
      <div className={`${shellClassName} filler-status-screen`}>
        <h2>{form.title || "Untitled Form"}</h2>
        <p>This form has no questions yet.</p>
        {onBack ? (
          <button type="button" onClick={onBack}>
            Back
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={shellClassName}>
      {isPreview ? (
        <>
          {onBack ? (
            <button type="button" className="back-link" onClick={onBack}>
              Back
            </button>
          ) : null}

          <h2>{form.title || "Untitled Form"}</h2>
          {form.description ? <p className="form-description">{form.description}</p> : null}

          <p className="progress-text">
            Question {currentQuestionIndex + 1} of {form.questions.length}
          </p>
        </>
      ) : (
        <div className="chat-page-header">
          {onBack ? (
            <button type="button" className="chat-header-back" onClick={onBack}>
              Back
            </button>
          ) : (
            <span className="chat-header-spacer" />
          )}

          <div className="chat-header-center">
            <h2 className="chat-page-title">{form.title || "Untitled Form"}</h2>
            {form.description ? (
              <p className="chat-page-subtitle">{form.description}</p>
            ) : null}
          </div>

          <p className="chat-page-progress">
            {currentQuestionIndex + 1}/{form.questions.length}
          </p>
        </div>
      )}

      <div
        className={isPreview ? "chat-thread" : "chat-thread chat-thread-fullscreen"}
        ref={chatThreadRef}
      >
        {historyEntries.map(({ question, answer }) => (
          <div key={question.id} className="chat-message-pair">
            <div className="chat-row chat-row-bot">
              <div className="chat-bubble chat-bubble-bot">
                {question.label}
                {question.required ? " *" : ""}
              </div>
            </div>
            <div className="chat-row chat-row-user">
              <div className="chat-bubble chat-bubble-user">
                {formatAnswerForChat(question, answer)}
              </div>
            </div>
          </div>
        ))}

        {currentQuestion ? (
          <div className="chat-row chat-row-bot chat-row-active">
            <div className="chat-bubble chat-bubble-bot">
              {currentQuestion.label}
              {currentQuestion.required ? " *" : ""}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={
          isPreview ? "chat-composer" : "chat-composer chat-composer-fullscreen"
        }
        onKeyDown={handleComposerKeyDown}
      >
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            error={currentFieldError}
            onChange={handleAnswerChange}
            hideLabel
          />
        ) : null}

        {submitError ? <p className="field-error">{submitError}</p> : null}

        <div className="filler-actions">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            Back
          </button>
          <button type="button" onClick={handleNext} disabled={isSubmitting}>
            {isLastQuestion ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
