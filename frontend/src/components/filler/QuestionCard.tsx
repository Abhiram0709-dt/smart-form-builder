import { useCallback, useEffect, useRef, useState } from "react";

import { useVoiceInput } from "../../hooks/useVoiceInput";
import type { AnswerValue, Question } from "../../types";

type QuestionCardProps = {
  question: Question;
  value: AnswerValue | undefined;
  error: string;
  onChange: (value: AnswerValue) => void;
  hideLabel?: boolean;
};

export function QuestionCard({
  question,
  value,
  error,
  onChange,
  hideLabel = false,
}: QuestionCardProps) {
  const stringValue = typeof value === "string" ? value : "";
  const listValue = Array.isArray(value) ? value : [];
  const [voiceError, setVoiceError] = useState("");
  const autoStartedQuestionRef = useRef<string | null>(null);

  useEffect(() => {
    setVoiceError("");
    autoStartedQuestionRef.current = null;
  }, [question.id]);

  const applyVoiceAnswer = useCallback((rawTranscript: string) => {
    const transcript = rawTranscript.trim();
    if (!transcript) {
      setVoiceError("Could not detect speech. Try again.");
      return;
    }

    if (question.type === "text") {
      onChange(transcript);
      return;
    }

    const normalizedTranscript = transcript.toLowerCase();
    const matchedOptions = question.options.filter((option) => {
      return (
        normalizedTranscript.includes(option.label.toLowerCase()) ||
        normalizedTranscript.includes(option.id.toLowerCase())
      );
    });

    if (question.type === "checkbox") {
      if (matchedOptions.length === 0) {
        setVoiceError("No matching option detected.");
        return;
      }

      onChange(matchedOptions.map((option) => option.id));
      return;
    }

    const matchedSingleOption = matchedOptions[0];
    if (!matchedSingleOption) {
      setVoiceError("No matching option detected.");
      return;
    }

    onChange(matchedSingleOption.id);
  }, [onChange, question]);

  const { isSupported, isRecording, startListening, toggleListening } = useVoiceInput({
    onFinalText: applyVoiceAnswer,
    onTranscript: (transcript) => {
      if (question.type === "text") {
        onChange(transcript);
      }
    },
    language: typeof navigator !== "undefined" ? navigator.language : "en-US",
    autoQuestionMark: question.type === "text",
    onError: ({ error: voiceEventError }) => {
      if (voiceEventError === "aborted") {
        return;
      }

      if (voiceEventError === "no-speech") {
        setVoiceError("No speech detected. Speak clearly and try again.");
        return;
      }

      setVoiceError(
        voiceEventError ? `Voice input error: ${voiceEventError}` : "Voice input failed."
      );
    },
  });

  useEffect(() => {
    if (!isSupported || question.type !== "text") {
      return;
    }

    if (autoStartedQuestionRef.current === question.id) {
      return;
    }

    autoStartedQuestionRef.current = question.id;

    const timerId = window.setTimeout(() => {
      startListening();
    }, 350);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isSupported, question.id, question.type, startListening]);

  const handleVoiceInput = () => {
    setVoiceError("");
    toggleListening();
  };

  const renderInput = () => {
    if (question.type === "text") {
      return (
        <input
          className="filler-input"
          type="text"
          placeholder="Type your answer"
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }

    if (question.type === "dropdown") {
      return (
        <select
          className="filler-input"
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (question.type === "mcq") {
      return (
        <div className="filler-options">
          {question.options.map((option) => (
            <label key={option.id} className="filler-option-row">
              <input
                type="radio"
                name={question.id}
                checked={stringValue === option.id}
                onChange={() => onChange(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="filler-options">
        {question.options.map((option) => (
          <label key={option.id} className="filler-option-row">
            <input
              type="checkbox"
              checked={listValue.includes(option.id)}
              onChange={(event) => {
                const nextValue = event.target.checked
                  ? [...listValue, option.id]
                  : listValue.filter((item) => item !== option.id);
                onChange(nextValue);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="question-card composer-card">
      {hideLabel ? null : (
        <p className="question-label">
          {question.label}
          {question.required ? <span className="required-mark"> *</span> : null}
        </p>
      )}
      {renderInput()}
      <div className="voice-controls">
        <button
          type="button"
          className={isRecording ? "voice-button voice-button-live" : "voice-button"}
          onClick={handleVoiceInput}
          disabled={!isSupported}
        >
          {isRecording ? "Stop Voice" : "Voice Input"}
        </button>
      </div>
      <p className="voice-hint">
        {isRecording
          ? "Listening... it will stop automatically when you stop speaking."
          : "Voice auto-starts for text. You can also press Voice Input manually."}
      </p>
      {voiceError ? <p className="voice-error">{voiceError}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
