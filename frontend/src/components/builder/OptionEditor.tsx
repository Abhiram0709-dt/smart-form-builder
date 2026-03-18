import type { Option } from "../../types";

type OptionEditorProps = {
  option: Option;
  index: number;
  onChangeLabel: (nextLabel: string) => void;
  onDelete: () => void;
};

export function OptionEditor({
  option,
  index,
  onChangeLabel,
  onDelete,
}: OptionEditorProps) {
  return (
    <div className="option-row">
      <input
        type="text"
        className="filler-input"
        placeholder={`Option ${index + 1}`}
        value={option.label}
        onChange={(event) => onChangeLabel(event.target.value)}
      />
      <button type="button" className="button-muted" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
