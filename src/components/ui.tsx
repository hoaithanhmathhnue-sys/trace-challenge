import { ReactNode, memo, useId } from 'react';
import { SESSION_PHASES, SessionPhase, TOPIC_CATEGORIES, TopicCategory } from '../model';
import { SaveState } from '../useWorkspace';
import { formatDateTime } from '../text';

interface FieldBase {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const TextInput = memo(function TextInput({
  label,
  hint,
  value,
  onChange,
  max = 300,
  placeholder,
  type = 'text',
  disabled = false,
}: FieldBase & { type?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <div className="hint" id={id + 'h'}>
          {hint}
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={hint ? id + 'h' : undefined}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
});

export const TextArea = memo(function TextArea({
  label,
  hint,
  value,
  onChange,
  max = 1500,
  placeholder,
  rows = 3,
  disabled = false,
}: FieldBase & { rows?: number }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <div className="hint" id={id + 'h'}>
          {hint}
        </div>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={hint ? id + 'h' : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
});

export const SelectField = memo(function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  empty,
  disabled = false,
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  empty?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <div className="hint" id={id + 'h'}>
          {hint}
        </div>
      )}
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={hint ? id + 'h' : undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
});

/** Khung hiển thị mã Python có đánh số dòng và tô sáng dòng đang xét. */
export const CodeBlock = memo(function CodeBlock({
  code,
  activeLine,
  caption,
}: {
  code: string;
  activeLine?: number;
  caption?: string;
}) {
  const lines = code.split(/\r?\n/);
  return (
    <div className="code-box" role="region" aria-label={caption || 'Đoạn mã Python'}>
      <div className="code-header">
        <span className="code-lang">PYTHON</span>
        {caption && <span className="code-caption">{caption}</span>}
      </div>
      <pre className="code-pre">
        {lines.map((line, i) => {
          const ln = i + 1;
          const active = activeLine === ln;
          return (
            <div key={ln} className={`code-line${active ? ' active' : ''}`}>
              <span className="code-ln" aria-hidden="true">
                {ln}
              </span>
              <code className="code-text">{line || ' '}</code>
              {active && <span className="code-ptr">← Dòng đang xét</span>}
            </div>
          );
        })}
      </pre>
    </div>
  );
});

export function CategoryBadge({ category }: { category: TopicCategory }) {
  return <span className={`badge cat-${category}`}>{TOPIC_CATEGORIES[category]}</span>;
}

export function PhaseBadge({ phase }: { phase: SessionPhase }) {
  return <span className={`badge phase-${phase}`}>{SESSION_PHASES[phase]}</span>;
}

export function MatchBadge({
  revealed,
  correct,
  isFirstWrong,
}: {
  revealed: boolean;
  correct: boolean;
  isFirstWrong?: boolean;
}) {
  if (!revealed) {
    return (
      <span className="badge locked">
        <span aria-hidden="true">🔒</span> Chưa mở vết
      </span>
    );
  }
  if (correct) {
    return (
      <span className="badge match-ok">
        <span aria-hidden="true">✓</span> Khớp dự đoán
      </span>
    );
  }
  return (
    <span className="badge match-err">
      <span aria-hidden="true">✗</span> {isFirstWrong ? 'Bước sai đầu tiên' : 'Lệch dự đoán'}
    </span>
  );
}

export function SaveStatus({
  status,
  savedAt,
  persistent,
  onRetry,
}: {
  status: SaveState;
  savedAt: number;
  persistent: boolean;
  onRetry: () => void;
}) {
  let text = '';
  let cls = 'ok';
  if (status === 'dirty') {
    text = 'Đang lưu…';
    cls = 'wait';
  } else if (status === 'saved') {
    text = persistent
      ? `Đã lưu trên máy này ${formatDateTime(savedAt)}`
      : 'Chỉ giữ trong trang này (trình duyệt chặn lưu)';
    if (!persistent) cls = 'bad';
  } else if (status === 'quota') {
    text = 'Không lưu được: bộ nhớ trình duyệt đầy. Hãy tải file sao lưu.';
    cls = 'bad';
  } else if (status === 'error') {
    text = 'Không lưu được. Hãy tải file sao lưu.';
    cls = 'bad';
  } else if (status === 'conflict') {
    text = 'Phiếu này vừa được sửa ở tab khác.';
    cls = 'bad';
  }
  return (
    <div className={`save ${cls}`} role="status" aria-live="polite">
      {text}
      {(status === 'quota' || status === 'error') && (
        <button className="btn small" onClick={onRetry}>
          Thử lưu lại
        </button>
      )}
    </div>
  );
}
