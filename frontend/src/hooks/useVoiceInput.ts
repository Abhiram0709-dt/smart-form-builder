import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal?: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export type VoiceInputError = {
  error: string;
  raw?: unknown;
};

type UseVoiceInputParams = {
  onFinalText?: (text: string) => void;
  onTranscript?: (text: string) => void;
  language?: string;
  blocked?: boolean;
  autoQuestionMark?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: VoiceInputError) => void;
};

function isQuestionButNoQuestionMark(text: string): boolean {
  const questionStarters = [
    "what",
    "how",
    "why",
    "when",
    "where",
    "which",
    "who",
    "whom",
    "whose",
    "can",
    "could",
    "will",
    "would",
    "should",
    "may",
    "might",
    "is",
    "are",
    "am",
    "was",
    "were",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",
    "shall",
  ];

  const lowerText = text.toLowerCase();
  return (
    !text.endsWith("?") &&
    questionStarters.some(
      (starter) => lowerText.startsWith(`${starter} `) || lowerText === starter
    )
  );
}

function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const voiceWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null;
}

export function useVoiceInput({
  onFinalText,
  onTranscript,
  language = "en-US",
  blocked = false,
  autoQuestionMark = true,
  onStart,
  onStop,
  onError,
}: UseVoiceInputParams = {}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const hasTranscriptRef = useRef(false);

  const onFinalTextRef = useRef(onFinalText);
  const onTranscriptRef = useRef(onTranscript);
  const onStartRef = useRef(onStart);
  const onStopRef = useRef(onStop);
  const onErrorRef = useRef(onError);

  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    onFinalTextRef.current = onFinalText;
    onTranscriptRef.current = onTranscript;
    onStartRef.current = onStart;
    onStopRef.current = onStop;
    onErrorRef.current = onError;
  }, [onFinalText, onTranscript, onStart, onStop, onError]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      transcriptRef.current = "";
      hasTranscriptRef.current = false;
      setIsRecording(true);
      onStartRef.current?.();
    };

    recognition.onresult = (event) => {
      const transcriptChunks: string[] = [];

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.isFinal) {
          transcriptChunks.push(result[0]?.transcript ?? "");
        }
      }

      const nextTranscript = transcriptChunks.join(" ").trim();
      if (nextTranscript) {
        transcriptRef.current = `${transcriptRef.current} ${nextTranscript}`.trim();
        hasTranscriptRef.current = true;
        onTranscriptRef.current?.(transcriptRef.current);
      }
    };

    recognition.onerror = (event) => {
      transcriptRef.current = "";
      hasTranscriptRef.current = false;
      setIsRecording(false);
      onErrorRef.current?.({
        error: event.error ?? "voice_error",
        raw: event,
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
      onStopRef.current?.();

      const transcript = transcriptRef.current.trim();
      const hasText = hasTranscriptRef.current;

      transcriptRef.current = "";
      hasTranscriptRef.current = false;

      if (!hasText || !transcript) {
        return;
      }

      let finalText = transcript;
      if (autoQuestionMark && isQuestionButNoQuestionMark(finalText)) {
        finalText += "?";
      }

      onFinalTextRef.current?.(finalText);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language, autoQuestionMark]);

  const startListening = useCallback(() => {
    if (blocked) {
      return false;
    }

    if (!recognitionRef.current) {
      return false;
    }

    try {
      recognitionRef.current.start();
      return true;
    } catch (rawError) {
      const safeMessage =
        rawError instanceof Error && rawError.message
          ? rawError.message
          : "start_failed";

      onErrorRef.current?.({ error: safeMessage, raw: rawError });
      return false;
    }
  }, [blocked]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    recognitionRef.current.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isRecording) {
      stopListening();
      return;
    }

    startListening();
  }, [isRecording, startListening, stopListening]);

  return {
    isSupported,
    isRecording,
    startListening,
    stopListening,
    toggleListening,
  };
}
