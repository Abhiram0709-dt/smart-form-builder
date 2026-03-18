import type { Question, QuestionType } from "../../types";
import { OptionEditor } from "./OptionEditor";

const OPTION_TYPES: QuestionType[] = ["mcq", "checkbox", "dropdown"];

type QuestionEditorProps = {
  question: Question;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (updates: Partial<Question>) => void;
  onTypeChange: (nextType: QuestionType) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, nextLabel: string) => void;
  onDeleteOption: (optionId: string) => void;
};

export function QuestionEditor({
  question,
  index,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onTypeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}: QuestionEditorProps) {
  const supportsOptions = OPTION_TYPES.includes(question.type);

  return (
    <div className="question-editor-card">
      <div className="question-editor-head">
        <h3>Question {index + 1}</h3>
        <div className="question-head-actions">
          <button
            type="button"
            className="button-muted"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            Move Up
          </button>
          <button
            type="button"
            className="button-muted"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            Move Down
          </button>
          <button type="button" className="button-muted" onClick={onDelete}>
            Delete Question
          </button>
        </div>
      </div>

      <label className="builder-label">
        Label
        <input
          className="filler-input"
          type="text"
          placeholder="Enter question"
          value={question.label}
          onChange={(event) => onUpdate({ label: event.target.value })}
        />
      </label>

      <div className="question-editor-grid">
        <label className="builder-label">
          Type
          <select
            className="filler-input"
            value={question.type}
            onChange={(event) => onTypeChange(event.target.value as QuestionType)}
          >
            <option value="text">text</option>
            <option value="mcq">mcq</option>
            <option value="checkbox">checkbox</option>
            <option value="dropdown">dropdown</option>
          </select>
        </label>

        <label className="builder-label checkbox-inline">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(event) => onUpdate({ required: event.target.checked })}
          />
          <span>Required</span>
        </label>
      </div>

      {supportsOptions ? (
        <div className="options-block">
          <p className="options-title">Options</p>
          {question.options.map((option, optionIndex) => (
            <OptionEditor
              key={option.id}
              option={option}
              index={optionIndex}
              onChangeLabel={(nextLabel) => onUpdateOption(option.id, nextLabel)}
              onDelete={() => onDeleteOption(option.id)}
            />
          ))}
          <button type="button" className="button-muted" onClick={onAddOption}>
            Add Option
          </button>
        </div>
      ) : null}
    </div>
  );
}
