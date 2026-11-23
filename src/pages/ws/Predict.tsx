import { useState } from 'react';
import { LIMITS, StudentStepPrediction, Workspace } from '../../model';
import { CodeBlock, SelectField, TextArea, TextInput } from '../../components/ui';
import { checkReadyToLockPrediction } from '../../validate';
import { formatDateTime } from '../../text';

interface Props {
  ws: Workspace;
  scaffolding: boolean;
  setScaffolding: (v: boolean) => void;
  patch: (p: Partial<Workspace>) => void;
  patchStepPred: (stepId: string, p: Partial<StudentStepPrediction>) => void;
  patchStepVal: (stepId: string, colKey: string, val: string) => void;
  onLockAndTrace: () => void;
}

export default function Predict({
  ws,
  scaffolding,
  setScaffolding,
  patch,
  patchStepPred,
  patchStepVal,
  onLockAndTrace,
}: Props) {
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});
  const [showOutputHint, setShowOutputHint] = useState(false);
  const [lockErrors, setLockErrors] = useState<string[]>([]);

  const ch = ws.challenge;
  const locked = ws.predictionLocked;

  const toggleHint = (id: string) => setOpenHints((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLock = () => {
    const missing = checkReadyToLockPrediction(ws);
    if (missing.length > 0) {
      setLockErrors(missing);
      return;
    }
    setLockErrors([]);
    onLockAndTrace();
  };

  return (
    <div>
      <section className="card">
        <div className="row between wrap">
          <h2>Phiếu A – Dự đoán trạng thái biến trước khi chạy &amp; Trao đổi cặp</h2>
          <label className="check inline">
            <input
              type="checkbox"
              checked={scaffolding}
              onChange={(e) => setScaffolding(e.target.checked)}
            />
            <span>Hỗ trợ gợi ý cột biến (nhóm cần hỗ trợ)</span>
          </label>
        </div>
        <p>
          <strong>Mục đích đoạn mã:</strong> {ch.purpose}
        </p>
        <p className="note-box">
          <strong>Quy tắc thời điểm đo (Mục 8.2):</strong> {ch.measureRule}
        </p>

        <CodeBlock code={ch.code} caption={`Đoạn mã cần dự đoán (${ch.lessonRef})`} />

        {locked && (
          <div className="banner ok-banner" role="status">
            <strong>🔒 Đã khóa dự đoán ban đầu lúc {formatDateTime(ws.lockedAt)}.</strong> Theo quy trình Mục 8.3, bảng dự đoán ban đầu được giữ nguyên làm bằng chứng học tập. Bạn hãy mở từng bước ở màn hình{' '}
            <a href={`#/ws/${ws.id}/trace`}>
              <strong>2. Xem từng trạng thái</strong>
            </a>{' '}
            và ghi phần sửa lỗi ở màn hình{' '}
            <a href={`#/ws/${ws.id}/reflect`}>
              <strong>3. Sửa bước sai &amp; Vận dụng</strong>
            </a>
            .
          </div>
        )}
      </section>

      <section className="card">
        <h3>1. Bảng dự đoán trạng thái biến tại các điểm dừng</h3>
        <p className="muted">
          Điền giá trị dự đoán cho từng mốc trước khi mở vết. Nếu biến chưa có giá trị (ví dụ biến lặp <code>i</code> trước khi vào vòng lặp), hãy ghi dấu gạch ngang <code>-</code>.
        </p>

        {scaffolding && (
          <div className="scaffold-box">
            <strong>Hướng dẫn các cột biến:</strong>
            <ul>
              {ch.columns.map((col) => (
                <li key={col.key}>
                  <code>{col.label}</code>: {col.hint || 'Giá trị của biến tại thời điểm đo'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="steps-list">
          {ch.steps.map((st, idx) => {
            const pred = ws.predictions[idx];
            const hintOpen = !!openHints[st.id];
            return (
              <div key={st.id} id={'step-' + st.id} className="step-card">
                <div className="row between wrap">
                  <div>
                    <span className="step-num">Điểm dừng {idx + 1}</span>
                    <strong className="step-title">{st.label}</strong>
                    <span className="badge muted" style={{ marginLeft: '0.5rem' }}>
                      Xét tại dòng {st.lineNo}
                    </span>
                  </div>
                  {st.guidingQuestion && (
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => toggleHint(st.id)}
                      aria-expanded={hintOpen}
                    >
                      💡 {hintOpen ? 'Ẩn câu hỏi gợi ý' : 'Gợi ý tư duy (không lộ đáp án)'}
                    </button>
                  )}
                </div>

                {hintOpen && st.guidingQuestion && (
                  <div className="hint-callout" role="note">
                    <strong>Câu hỏi định hướng:</strong> {st.guidingQuestion}
                  </div>
                )}

                <div className="grid-vars">
                  {ch.columns.map((col) => (
                    <TextInput
                      key={col.key}
                      label={`Dự đoán: ${col.label}`}
                      hint={scaffolding ? col.hint : undefined}
                      value={pred?.values[col.key] ?? ''}
                      max={LIMITS.short}
                      disabled={locked}
                      placeholder="Nhập giá trị (hoặc -)"
                      onChange={(v) => patchStepVal(st.id, col.key, v)}
                    />
                  ))}
                </div>

                <div className="grid2">
                  <TextInput
                    label="Lí do / Phép tính tại bước này"
                    hint="Ví dụ: Lấy giá trị cũ cộng với i hiện tại..."
                    value={pred?.reason ?? ''}
                    max={LIMITS.mid}
                    disabled={locked}
                    placeholder="Vì sao biến nhận giá trị này?"
                    onChange={(v) => patchStepPred(st.id, { reason: v })}
                  />
                  <div>
                    <label className="check" style={{ marginTop: '1.4rem' }}>
                      <input
                        type="checkbox"
                        checked={pred?.pairDiff ?? false}
                        disabled={locked}
                        onChange={(e) => patchStepPred(st.id, { pairDiff: e.target.checked })}
                      />
                      <span>
                        <strong>Trao đổi cặp (Bước 3):</strong> Khoanh bước này có dự đoán khác nhau với bạn cùng cặp
                      </span>
                    </label>
                    {pred?.pairDiff && (
                      <TextInput
                        label="Ghi lại hai dự đoán khác nhau & lí giải của cặp"
                        value={pred?.pairNote ?? ''}
                        max={LIMITS.mid}
                        disabled={locked}
                        placeholder="Ví dụ: Em đoán 3, bạn đoán 2 vì..."
                        onChange={(v) => patchStepPred(st.id, { pairNote: v })}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="row between wrap">
          <h3>2. Dự đoán đầu ra cuối cùng &amp; Giải thích thứ tự thực hiện</h3>
          {ch.outputGuidingQuestion && (
            <button
              type="button"
              className="btn small"
              onClick={() => setShowOutputHint((s) => !s)}
              aria-expanded={showOutputHint}
            >
              💡 {showOutputHint ? 'Ẩn gợi ý đầu ra' : 'Câu hỏi gợi ý đầu ra'}
            </button>
          )}
        </div>

        {showOutputHint && ch.outputGuidingQuestion && (
          <div className="hint-callout" role="note">
            <strong>Câu hỏi định hướng:</strong> {ch.outputGuidingQuestion}
          </div>
        )}

        <div className="grid2">
          <TextInput
            label="Dự đoán kết quả đầu ra cuối cùng (in ra màn hình)"
            hint="Chú ý: Đầu ra của lệnh print cuối chương trình, không phải dãy giá trị trung gian."
            value={ws.predictedOutput}
            max={LIMITS.short}
            disabled={locked}
            placeholder="Nhập kết quả dự đoán..."
            onChange={(v) => patch({ predictedOutput: v })}
          />
          <SelectField
            label="Bước nào theo bạn là dễ nhầm nhất?"
            hint="Giúp đối chiếu khi lật mở từng trạng thái."
            value={ws.trickyStepId}
            disabled={locked}
            onChange={(v) => patch({ trickyStepId: v })}
            empty="— Chọn mốc dễ nhầm —"
            options={ch.steps.map((s) => [s.id, s.label])}
          />
        </div>

        <TextArea
          label="Giải thích thứ tự và quy tắc thực hiện lệnh (Tiêu chí Rubric 2 điểm)"
          hint="Ví dụ: Giải thích vì sao range dừng trước cận trên; lệnh gán trong thân vòng lặp dùng giá trị cũ hay mới của biến..."
          value={ws.orderExplanation}
          rows={3}
          max={LIMITS.long}
          disabled={locked}
          placeholder="Nhập lời giải thích của bạn trước khi mở vết..."
          onChange={(v) => patch({ orderExplanation: v })}
        />

        {lockErrors.length > 0 && (
          <div className="banner bad" role="alert">
            <strong>Cần điền đủ dự đoán trước khi mở vết (Mục 2 &amp; Mục 4):</strong>
            <ul className="issue-list">
              {lockErrors.map((e, i) => (
                <li key={i}>⚠ {e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="row wrap" style={{ marginTop: '0.8rem' }}>
          {!locked ? (
            <button type="button" className="btn primary big" onClick={handleLock}>
              🔒 Khóa bảng dự đoán &amp; Chuyển sang Xem từng trạng thái →
            </button>
          ) : (
            <a className="btn primary big" href={`#/ws/${ws.id}/trace`}>
              Sang Màn hình 2: Xem từng trạng thái (Mở vết) →
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
