import { useState } from 'react';
import {
  LIMITS,
  Workspace,
  detectActualFirstWrongStepId,
  isStepCorrect,
  isVariantOutputCorrect,
} from '../../model';
import { CodeBlock, SelectField, TextArea, TextInput } from '../../components/ui';
import { isValueMatch } from '../../text';

interface Props {
  ws: Workspace;
  patch: (p: Partial<Workspace>) => void;
  patchCorrectedVal: (stepId: string, colKey: string, val: string) => void;
}

export default function Reflect({ ws, patch, patchCorrectedVal }: Props) {
  const [variantErr, setVariantErr] = useState('');
  const ch = ws.challenge;
  const allRevealed = ws.predictionLocked && ws.revealedCount >= ch.steps.length;
  const actualFirstWrong = detectActualFirstWrongStepId(ws);

  const stepOptions: [string, string][] = [
    ['none', 'Không có bước sai – Dự đoán ban đầu của em khớp toàn bộ các mốc'],
    ...ch.steps.map((s): [string, string] => [s.id, s.label]),
  ];

  const handleRevealVariant = () => {
    if (!ws.variantPredictedOutput.trim()) {
      setVariantErr('Hãy nhập dự đoán kết quả đầu ra mới trước khi bấm kiểm tra đáp án vận dụng.');
      return;
    }
    setVariantErr('');
    patch({ variantRevealed: true });
  };

  return (
    <div>
      <section className="card">
        <h2>Phiếu B – Phát hiện bước sai đầu tiên và tự sửa cách hiểu (Mục 2 bước 5 &amp; Mục 8.4)</h2>
        {!allRevealed && (
          <div className="banner" role="note">
            <strong>Lưu ý:</strong> Bạn mới mở {ws.revealedCount}/{ch.steps.length} mốc ở{' '}
            <a href={`#/ws/${ws.id}/trace`}>Màn hình 2 (Xem từng trạng thái)</a>. Hãy mở hết các mốc trạng thái để đối chiếu chính xác bước đầu tiên có sai lệch.
          </div>
        )}

        <div className="row between wrap">
          <div style={{ flex: 1, minWidth: '280px' }}>
            <SelectField
              label="Bước đầu tiên có kết quả dự đoán sai lệch là bước nào?"
              hint="Theo Mục 8.4: Nếu dự đoán ban đầu của bạn hoàn toàn đúng, hãy chọn 'Không có bước sai' và giải thích vì sao vết đúng (không bắt buộc tạo lỗi giả)."
              value={ws.firstWrongStepId}
              onChange={(v) => patch({ firstWrongStepId: v })}
              empty="— Chọn bước đầu tiên dự đoán sai (hoặc Không có bước sai) —"
              options={stepOptions}
            />
          </div>
          {allRevealed && (
            <div style={{ marginTop: '1.1rem' }}>
              <button
                type="button"
                className="btn small"
                onClick={() => patch({ firstWrongStepId: actualFirstWrong })}
              >
                Lấy từ kết quả đối chiếu ở Màn hình 2
              </button>
            </div>
          )}
        </div>

        {allRevealed && ws.firstWrongStepId && (
          <div
            className={`banner ${ws.firstWrongStepId === actualFirstWrong ? 'ok-banner' : 'bad'}`}
            role="status"
          >
            {ws.firstWrongStepId === actualFirstWrong ? (
              <span>
                <strong>✓ Xác định chính xác!</strong>{' '}
                {actualFirstWrong === 'none'
                  ? 'Bảng dự đoán ban đầu của bạn khớp toàn bộ các mốc trong bảng vết chuẩn.'
                  : `Bước đầu tiên có sai lệch đúng là "${ch.steps.find((s) => s.id === actualFirstWrong)?.label}".`}
              </span>
            ) : (
              <span>
                <strong>⚠ Chưa khớp với bảng đối chiếu:</strong> Theo bảng vết ở Màn hình 2,{' '}
                {actualFirstWrong === 'none'
                  ? 'dự đoán ban đầu của bạn không có bước nào sai (hãy chọn "Không có bước sai").'
                  : `bước đầu tiên có sai lệch là "${ch.steps.find((s) => s.id === actualFirstWrong)?.label}".`}
              </span>
            )}
          </div>
        )}

        {allRevealed && actualFirstWrong !== 'none' && (
          <div style={{ marginTop: '0.8rem' }}>
            <h3>Bảng tự sửa lại các mốc bị lệch (Dự đoán ban đầu vẫn được giữ nguyên làm bằng chứng)</h3>
            <p className="muted">
              Điền lại giá trị đúng cho các mốc bị lệch để hoàn chỉnh đường đi của thuật toán:
            </p>
            <table className="trace-table">
              <thead>
                <tr>
                  <th>Mốc điểm dừng</th>
                  {ch.columns.map((col) => (
                    <th key={col.key}>{col.label} (Ban đầu → Sửa lại)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ch.steps.map((st, idx) => {
                  const pred = ws.predictions[idx];
                  const stepOk = isStepCorrect(st, pred, ch.columns);
                  if (stepOk) return null;
                  return (
                    <tr key={st.id}>
                      <td>
                        <strong>{st.label}</strong>
                        {st.id === actualFirstWrong && (
                          <div>
                            <span className="badge match-err">Bước sai đầu tiên</span>
                          </div>
                        )}
                      </td>
                      {ch.columns.map((col) => {
                        const oldVal = pred?.values[col.key] || '(trống)';
                        const corrVal = pred?.correctedValues[col.key] ?? '';
                        const fixedOk = isValueMatch(corrVal, st.expected[col.key] ?? '');
                        return (
                          <td key={col.key}>
                            <div className="muted" style={{ marginBottom: '0.25rem' }}>
                              Dự đoán cũ: <s>{oldVal}</s>
                            </div>
                            <input
                              type="text"
                              aria-label={`Sửa ${col.label} ở ${st.label}`}
                              value={corrVal}
                              placeholder={`Sửa lại ${col.label}...`}
                              onChange={(e) => patchCorrectedVal(st.id, col.key, e.target.value)}
                            />
                            {corrVal.trim() && (
                              <div style={{ marginTop: '0.2rem', fontSize: '0.82rem' }}>
                                {fixedOk ? (
                                  <span className="ok-text">✓ Đã sửa đúng</span>
                                ) : (
                                  <span className="err-text">Chuẩn là: {st.expected[col.key]}</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <TextArea
          label={
            actualFirstWrong === 'none'
              ? 'Giải thích kiểm chứng vết (Vì sao các mốc dự đoán của bạn không có bước sai? – Tiêu chí Rubric 2 điểm)'
              : 'Nguyên nhân sai lệch ở bước đầu tiên và câu giải thích tự sửa (Tiêu chí Rubric 2 điểm)'
          }
          hint={
            actualFirstWrong === 'none'
              ? 'Ví dụ: Em đã xác định đúng cận dừng của range và ở mỗi lượt đều lấy giá trị biến ngay sau lượt trước cộng với i hiện tại...'
              : 'Ví dụ: Ở bước này em nhầm lệnh gán lấy giá trị khởi tạo 0 thay vì giá trị vừa cập nhật từ lượt trước / nhầm range lấy cả cận trên...'
          }
          value={ws.wrongCauseExplanation}
          rows={3}
          max={LIMITS.long}
          placeholder="Viết rõ nguyên nhân hoặc quy tắc kiểm chứng của bạn..."
          onChange={(v) => patch({ wrongCauseExplanation: v })}
        />
      </section>

      <section className="card">
        <h2>Bước 6: Vận dụng – Thay đổi một giá trị đầu vào / điều kiện (Mục 2 bước 6 &amp; Mục 8.3)</h2>
        <p>
          <strong>Yêu cầu vận dụng:</strong> {ch.variantPrompt}
        </p>

        {ch.variantCode && <CodeBlock code={ch.variantCode} caption="Đoạn mã khi thay đổi dữ liệu / cận lặp" />}

        <div className="grid2">
          <TextInput
            label="Dự đoán dãy trạng thái biến sau mỗi lượt ở bài toán mới"
            hint="Ví dụ: 1, 3, 6, 10 hoặc 2, 6, 24"
            value={ws.variantPredictedTrace}
            max={LIMITS.short}
            placeholder="Nhập dãy giá trị sau mỗi lượt..."
            onChange={(v) => patch({ variantPredictedTrace: v })}
          />
          <TextInput
            label="Dự đoán kết quả đầu ra mới (print)"
            hint="Nhập kết quả cuối cùng trước khi bấm Kiểm tra"
            value={ws.variantPredictedOutput}
            max={LIMITS.short}
            placeholder="Nhập đầu ra mới..."
            onChange={(v) => patch({ variantPredictedOutput: v })}
          />
        </div>

        <TextArea
          label="Giải thích vì sao sự thay đổi đầu vào/cận lại dẫn đến kết quả mới này"
          value={ws.variantExplanation}
          rows={2}
          max={LIMITS.long}
          placeholder="Ví dụ: Khi đổi range(1, 4) thành range(1, 5), vòng lặp chạy thêm lượt i = 4 nên tổng cộng thêm 4..."
          onChange={(v) => patch({ variantExplanation: v })}
        />

        {variantErr && (
          <p className="banner bad" role="alert">
            {variantErr}
          </p>
        )}

        {!ws.variantRevealed ? (
          <button type="button" className="btn primary" onClick={handleRevealVariant}>
            🔓 Kiểm tra dự đoán Vận dụng
          </button>
        ) : (
          <div className={`explanation-box ${isVariantOutputCorrect(ws) ? 'ok-border' : 'err-border'}`}>
            <p>
              <strong>Đối chiếu kết quả Vận dụng:</strong>{' '}
              {isVariantOutputCorrect(ws) ? (
                <span className="ok-text">✓ Bạn dự đoán ĐÚNG đầu ra mới ({ch.variantExpectedOutput})!</span>
              ) : (
                <span className="err-text">
                  ✗ Dự đoán đầu ra của bạn ({ws.variantPredictedOutput || 'trống'}) chưa khớp với đáp án chuẩn (
                  {ch.variantExpectedOutput}).
                </span>
              )}
            </p>
            <p>
              <strong>Dãy trạng thái chuẩn:</strong> <code>{ch.variantExpectedTrace}</code> ·{' '}
              <strong>Đầu ra chuẩn:</strong> <code>{ch.variantExpectedOutput}</code>
            </p>
            <p>
              <strong>Giải thích:</strong> {ch.variantExplanation}
            </p>
          </div>
        )}

        <div className="row wrap" style={{ marginTop: '1rem' }}>
          <a className="btn primary big" href={`#/ws/${ws.id}/export`}>
            Hoàn tất Phiếu B → Sang Màn hình 4: Xuất phiếu &amp; Nộp bài
          </a>
        </div>
      </section>
    </div>
  );
}
