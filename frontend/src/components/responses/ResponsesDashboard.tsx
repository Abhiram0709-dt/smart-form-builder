import { useEffect, useMemo, useState } from "react";

import { api } from "../../services/api";
import type {
  AnswerValue,
  Form,
  FormAnalytics,
  Question,
  ResponseRead,
} from "../../types";

type ResponsesDashboardProps = {
  formId: string;
  onBack: () => void;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function answerLabel(question: Question, answer: AnswerValue | undefined): string {
  if (answer === undefined) {
    return "-";
  }

  if (question.type === "checkbox") {
    if (!Array.isArray(answer) || answer.length === 0) {
      return "-";
    }

    return answer
      .map((selectedId) => {
        const match = question.options.find((option) => option.id === selectedId);
        return match ? match.label : selectedId;
      })
      .join(", ");
  }

  if (typeof answer !== "string" || !answer.trim()) {
    return "-";
  }

  if (question.type === "text") {
    return answer;
  }

  const option = question.options.find((item) => item.id === answer);
  return option ? option.label : answer;
}

export function ResponsesDashboard({ formId, onBack }: ResponsesDashboardProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<ResponseRead[]>([]);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setLoadError("");

      try {
        const [formData, responsesData, analyticsData] = await Promise.all([
          api.getForm(formId),
          api.getResponses(formId),
          api.getFormAnalytics(formId),
        ]);

        if (!ignore) {
          setForm(formData);
          setResponses(responsesData.items);
          setAnalytics(analyticsData);
        }
      } catch (error: unknown) {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : "Failed to load responses.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [formId]);

  const questions = useMemo(() => form?.questions ?? [], [form]);

  if (loading) {
    return (
      <div className="responses-shell">
        <p>Loading responses...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="responses-shell">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <p className="field-error">{loadError}</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="responses-shell">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <p className="field-error">Form not found.</p>
      </div>
    );
  }

  return (
    <div className="responses-shell">
      <div className="responses-top-row">
        <button type="button" onClick={onBack}>
          Back
        </button>
      </div>

      <h2>Responses for {form.title}</h2>
      <p className="form-description">Form ID: {form.id}</p>

      <section className="summary-block">
        <h3>Summary View</h3>
        <p>Total Responses: {analytics?.total_responses ?? responses.length}</p>

        {analytics?.questions.map((questionSummary) => (
          <div key={questionSummary.question_id} className="summary-question-card">
            <p className="summary-question-title">{questionSummary.label}</p>
            <p>
              Answered: {questionSummary.total_answered} | Unanswered: {questionSummary.unanswered_count}
            </p>

            {questionSummary.options.length > 0 ? (
              <ul className="summary-list">
                {questionSummary.options.map((optionStat) => (
                  <li key={optionStat.id}>
                    {optionStat.label}: {optionStat.count}
                  </li>
                ))}
              </ul>
            ) : null}

            {questionSummary.text_samples.length > 0 ? (
              <ul className="summary-list">
                {questionSummary.text_samples.map((sample, index) => (
                  <li key={`${questionSummary.question_id}-${index}`}>{sample}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </section>

      <section className="table-block">
        <h3>Table View</h3>

        {responses.length === 0 ? (
          <p>No responses yet.</p>
        ) : (
          <div className="responses-table-wrap">
            <table className="responses-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Submitted At</th>
                  {questions.map((question) => (
                    <th key={question.id}>{question.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((responseItem, index) => (
                  <tr key={responseItem.id}>
                    <td>{index + 1}</td>
                    <td>{formatDateTime(responseItem.submitted_at)}</td>
                    {questions.map((question) => (
                      <td key={`${responseItem.id}-${question.id}`}>
                        {answerLabel(question, responseItem.answers[question.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
