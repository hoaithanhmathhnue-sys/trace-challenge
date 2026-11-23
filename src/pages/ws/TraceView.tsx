import { useEffect, useState } from 'react';
import {
  Workspace,
  countCorrectSteps,
  detectActualFirstWrongStepId,
  isOutputCorrect,
  isStepCorrect,
} from '../../model';
import { CodeBlock, MatchBadge } from '../../components/ui';
import { checkReadyToLockPrediction } from '../../validate';
import { isValueMatch } from '../../text';

interface Props {
  ws: Workspace;
  onLockNow: () => void;
  onRevealNextStep: () => void;
  onRevealOutput: () => void;
}

export default function TraceView({ ws, onLockNow, onRevealNextStep, onRevealOutput }: Props) {
  const [lockErrors, setLockErrors] = useState<string[]>([]);
  const ch = ws.challenge;
  const totalSteps = ch.steps.length;
  const allStepsRevealed = ws.predictionLocked && ws.revealedCount >= totalSteps;

  // Hỗ trợ bàn phím (Mục 4 & 8.6: "dùng được bằng bàn phím"): bấm Space hoặc Enter để mở bước tiếp theo
  useEffect(() => {
    if (!ws.predictionLocked) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (ws.revealedCount < totalSteps) {
          e.preventDefault();
          onRevealNextStep();
        } else if (!ws.outputRevealed) {
          e.preventDefault();
          onRevealOutput();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ws.predictionLocked, ws.revealedCount, ws.outputRevealed, totalSteps, onRevealNextStep, onRevealOutput]);

  if (!ws.predictionLocked) {
    const missing = checkReadyToLockPrediction(ws);
    return (
      <section className="card">
        <h2>Màn hình 2: Xem từng trạng thái (Quan sát có kiểm soát)</h2>
        <div className="banner bad" role="alert">
          <p>
            <strong>🔒 Không mở kết quả trước giai đoạn dự đoán (Mục 2 &amp; Mục 4).</strong>
          </p>
          <p>
            Bạn cần điền bảng dự đoán trạng thái biến, dự đoán đầu ra và lời giải thích ở{' '}
            <a href={`#/ws/${ws.id}/predict`}>
              <strong>Màn hình 1 (Phiếu A)</strong>
            </a>
            , sau đó bấm <strong>Khóa bảng dự đoán</strong> để hệ thống lưu bằng chứng ban đầu trước khi lật mở từng bước.
          </p>
        </div>

        {missing.length > 0 ? (
          <div>
            <p>
              <strong>Các mục còn thiếu ở Phiếu A ({missing.length}):</strong>
            </p>
            <ul className="issue-list">
              {missing.map((m, i) => (
                <li key={i}>⚠ {m}</li>
              ))}
            </ul>
            <div style={{ marginTop: '0.8rem' }}>
              <a className="btn primary" href={`#/ws/${ws.id}/predict`}>
                ← Quay lại Màn hình 1 để điền nốt dự đoán
              </a>
            </div>
          </div>
        ) : (
          <div>
            <p className="ok-text">Bạn đã điền đủ các mục ở Phiếu A. Hãy bấm nút dưới đây để khóa dự đoán và bắt đầu mở vết từng bước:</p>
            {lockErrors.length > 0 && (
              <p className="banner bad">{lockErrors.join('; ')}</p>
            )}
            <button
              className="btn primary big"
              onClick={() => {
                const errs = checkReadyToLockPrediction(ws);
                if (errs.length) setLockErrors(errs);
                else onLockNow();
              }}
            >
              🔒 Khóa dự đoán ban đầu &amp; Bắt đầu mở vết từng bước
            </button>
          </div>
        )}
      </section>
    );
  }

  // Xác định dòng lệnh đang được tô sáng theo mốc vừa mở gần nhất
  const activeStep = ws.revealedCount > 0 ? ch.steps[Math.min(ws.revealedCount - 1, totalSteps - 1)] : undefined;
  const actualFirstWrong = detectActualFirstWrongStepId(ws);

  return (
    <div>
      <section className="card">
        <div className="row between wrap">
          <div>
            <h2>Màn hình 2: Xem từng trạng thái (Mở vết từng bước)</h2>
            <p className="muted">
              Mở lần lượt từng điểm dừng và đối chiếu ngay với dự đoán ban đầu. Mẹo bàn phím: nhấn phím{' '}
              <kbd>Space</kbd> hoặc <kbd>Enter</kbd> để lật mở bước tiếp theo.
            </p>
          </div>
          <div className="trace-progress">
            Đã mở: <strong>{ws.revealedCount}</strong> / {totalSteps} mốc trạng thái
          </div>
        </div>

        <CodeBlock
          code={ch.code}
          activeLine={activeStep?.lineNo}
          caption={
            activeStep
              ? `Đang quan sát: ${activeStep.label} (Dòng ${activeStep.lineNo})`
              : 'Bấm "Mở bước tiếp theo" để bắt đầu lật thẻ trạng thái đầu tiên'
          }
        />

        <div className="row wrap trace-controls">
          {ws.revealedCount < totalSteps ? (
            <button type="button" className="btn primary big" onClick={onRevealNextStep}>
              ▶ Mở bước tiếp theo: {ch.steps[ws.revealedCount].label} ({ws.revealedCount + 1}/{totalSteps})
            </button>
          ) : !ws.outputRevealed ? (
            <button type="button" className="btn primary big" onClick={onRevealOutput}>
              ▶ Đã mở đủ {totalSteps} mốc! Bấm để mở Kết quả đầu ra thực tế (print)
            </button>
          ) : (
            <a className="btn primary big" href={`#/ws/${ws.id}/reflect`}>
              Đã mở toàn bộ vết → Sang Màn hình 3: Sửa bước sai &amp; Vận dụng
            </a>
          )}
        </div>
      </section>

      <div className="steps-list">
        {ch.steps.map((st, idx) => {
          const pred = ws.predictions[idx];
          const isRevealed = idx < ws.revealedCount;
          const isNextToReveal = idx === ws.revealedCount;
          const stepOk = isStepCorrect(st, pred, ch.columns);
          const isFirstWrong = isRevealed && !stepOk && st.id === actualFirstWrong;

          return (
            <section
              key={st.id}
              className={`card trace-card${isRevealed ? (stepOk ? ' trace-ok' : ' trace-err') : ' trace-locked'}${isFirstWrong ? ' first-wrong-card' : ''}`}
              aria-label={st.label}
            >
              <div className="row between wrap">
                <div>
                  <span className="step-num">Mốc {idx + 1}/{totalSteps}</span>
                  <strong className="step-title">{st.label}</strong>
                  <span className="badge muted" style={{ marginLeft: '0.5rem' }}>
                    Dòng {st.lineNo}
                  </span>
                </div>
                <MatchBadge revealed={isRevealed} correct={stepOk} isFirstWrong={isFirstWrong} />
              </div>

              {isFirstWrong && (
                <div className="first-wrong-banner" role="alert">
                  <strong>⚠ ĐÂY LÀ BƯỚC ĐẦU TIÊN CÓ SAI LỆCH SO VỚI DỰ ĐOÁN BAN ĐẦU!</strong> Hãy đối chiếu giá trị bên dưới và ghi nhận bước này vào Phiếu B (Màn hình 3).
                </div>
              )}

              <table className="trace-table">
                <thead>
                  <tr>
                    <th>Biến theo dõi</th>
                    <th>Dự đoán ban đầu (Phiếu A)</th>
                    <th>Trạng thái chuẩn của chương trình</th>
                    <th>Đối chiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {ch.columns.map((col) => {
                    const pVal = pred?.values[col.key] || '(trống)';
                    const eVal = st.expected[col.key] ?? '';
                    const cellOk = isValueMatch(pred?.values[col.key] ?? '', eVal);
                    return (
                      <tr key={col.key}>
                        <td>
                          <code>{col.label}</code>
                        </td>
                        <td>
                          <strong>{pVal}</strong>
                        </td>
                        <td>
                          {isRevealed ? (
                            <code className="expected-val">{eVal}</code>
                          ) : (
                            <span className="muted">🔒 Chưa mở bước này</span>
                          )}
                        </td>
                        <td>
                          {!isRevealed ? (
                            <span className="muted">—</span>
                          ) : cellOk ? (
                            <span className="ok-text">✓ Khớp</span>
                          ) : (
                            <span className="err-text">✗ Lệch (chuẩn: {eVal})</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="muted" style={{ marginTop: '0.4rem' }}>
                <strong>Lí do bạn đã ghi ở Phiếu A:</strong> {pred?.reason || '(Không ghi lí do)'}
                {pred?.pairDiff ? ` · [Trao đổi cặp: ${pred.pairNote || 'Có khác biệt với bạn cùng cặp'}]` : ''}
              </div>

              {!isRevealed ? (
                <div style={{ marginTop: '0.6rem' }}>
                  {st.guidingQuestion && (
                    <div className="hint-callout">
                      <strong>💡 Câu hỏi tự kiểm tra trước khi mở:</strong> {st.guidingQuestion}
                    </div>
                  )}
                  {isNextToReveal && (
                    <button type="button" className="btn primary" onClick={onRevealNextStep} style={{ marginTop: '0.5rem' }}>
                      🔓 Lật mở trạng thái của {st.label}
                    </button>
                  )}
                </div>
              ) : (
                <div className="explanation-box">
                  <strong>Giải thích quy tắc thực hiện lệnh:</strong> {st.explanation}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="card">
        <div className="row between wrap">
          <h3>Kết quả đầu ra cuối cùng của đoạn mã (Lệnh print)</h3>
          <MatchBadge revealed={ws.outputRevealed} correct={isOutputCorrect(ws)} />
        </div>

        <table className="trace-table">
          <thead>
            <tr>
              <th>Hạng mục</th>
              <th>Dự đoán ban đầu của bạn</th>
              <th>Kết quả đầu ra chuẩn</th>
              <th>Đối chiếu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Đầu ra cuối cùng</td>
              <td>
                <strong>{ws.predictedOutput || '(trống)'}</strong>
              </td>
              <td>
                {ws.outputRevealed ? (
                  <code className="expected-val">{ch.expectedOutput}</code>
                ) : (
                  <span className="muted">🔒 Mở hết {totalSteps} mốc trạng thái để xem đầu ra</span>
                )}
              </td>
              <td>
                {!ws.outputRevealed ? (
                  <span className="muted">—</span>
                ) : isOutputCorrect(ws) ? (
                  <span className="ok-text">✓ Dự đoán đúng đầu ra</span>
                ) : (
                  <span className="err-text">✗ Lệch (đầu ra chuẩn là {ch.expectedOutput})</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {!ws.outputRevealed ? (
          <div style={{ marginTop: '0.6rem' }}>
            {ch.outputGuidingQuestion && (
              <div className="hint-callout">
                <strong>💡 Gợi ý kiểm tra đầu ra:</strong> {ch.outputGuidingQuestion}
              </div>
            )}
            <button
              type="button"
              className="btn primary"
              disabled={!allStepsRevealed}
              onClick={onRevealOutput}
              style={{ marginTop: '0.5rem' }}
            >
              {allStepsRevealed
                ? '🔓 Lật mở Kết quả đầu ra chuẩn'
                : `Hãy mở hết ${totalSteps} mốc trạng thái ở trên trước khi mở đầu ra`}
            </button>
          </div>
        ) : (
          <div className="explanation-box">
            <strong>Giải thích đầu ra:</strong> {ch.outputExplanation}
          </div>
        )}
      </section>

      {ws.outputRevealed && (
        <section className="card summary-banner">
          <h3>Tổng kết đối chiếu bảng vết</h3>
          <p>
            Bạn dự đoán khớp hoàn toàn <strong>{countCorrectSteps(ws)} / {totalSteps}</strong> mốc trạng thái và dự đoán đầu ra{' '}
            <strong>{isOutputCorrect(ws) ? 'ĐÚNG' : 'CHƯA ĐÚNG'}</strong>.
          </p>
          <p>
            {actualFirstWrong === 'none' ? (
              <span className="ok-text">
                <strong>★ Xuất sắc! Tất cả các mốc trạng thái bạn dự đoán ban đầu đều khớp 100% với bảng vết chuẩn.</strong> Hãy chuyển sang Màn hình 3 (Phiếu B) để xác nhận "Không có bước sai", giải thích vì sao vết đúng và làm câu hỏi Vận dụng.
              </span>
            ) : (
              <span className="err-text">
                <strong>
                  ★ Bước đầu tiên có sai lệch trên bảng vết của bạn là:{' '}
                  {ch.steps.find((s) => s.id === actualFirstWrong)?.label}.
                </strong>{' '}
                Hãy chuyển sang Màn hình 3 (Phiếu B) để đánh dấu bước này, sửa lại giá trị và giải thích nguyên nhân.
              </span>
            )}
          </p>
          <a className="btn primary big" href={`#/ws/${ws.id}/reflect`}>
            Sang Màn hình 3: Sửa bước sai &amp; Làm câu hỏi Vận dụng (Phiếu B) →
          </a>
        </section>
      )}
    </div>
  );
}
