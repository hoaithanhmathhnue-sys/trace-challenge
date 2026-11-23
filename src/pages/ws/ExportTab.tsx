import {
  SESSION_PHASES,
  Workspace,
  countCorrectSteps,
  detectActualFirstWrongStepId,
  isOutputCorrect,
  isStepCorrect,
  isVariantOutputCorrect,
} from '../../model';
import { TRACE_RUBRIC, sumScores } from '../../rubric';
import { formatDateTime } from '../../text';

interface Props {
  ws: Workspace;
  onPrint: () => void;
  onDocx: () => void;
  onBackup: () => void;
  onCheck: () => void;
}

export default function ExportTab({ ws, onPrint, onDocx, onBackup, onCheck }: Props) {
  const ch = ws.challenge;
  const totalSteps = ch.steps.length;
  const correctSteps = countCorrectSteps(ws);
  const actualFirstWrong = detectActualFirstWrongStepId(ws);
  const hasGrades = ws.grading.scores.some((s) => s !== null);

  const studentPickedWrongLabel =
    ws.firstWrongStepId === 'none'
      ? 'Không có bước sai (dự đoán ban đầu khớp toàn bộ)'
      : ch.steps.find((s) => s.id === ws.firstWrongStepId)?.label || '(Chưa chọn ở Phiếu B)';

  return (
    <div>
      <section className="card">
        <h2>Tổng hợp bằng chứng học tập &amp; Xuất phiếu (Phiếu A + Bảng vết + Phiếu B)</h2>
        <p className="muted">
          Kiểm tra lại toàn bộ hồ sơ dự đoán trước khi xuất ra file Word (<code>.docx</code>), in phiếu giấy (A4) hoặc tải file sao lưu (<code>.json</code>) để nộp cho giáo viên.
        </p>

        <div className="row wrap" style={{ margin: '0.8rem 0' }}>
          <button type="button" className="btn primary big" onClick={onDocx}>
            📄 Xuất phiếu Word (.docx)
          </button>
          <button type="button" className="btn big" onClick={onPrint}>
            🖨 In phiếu học tập (A4 / PDF)
          </button>
          <button type="button" className="btn big" onClick={onBackup}>
            💾 Tải file nộp bài / sao lưu (.json)
          </button>
          <button type="button" className="btn" onClick={onCheck}>
            ✓ Kiểm tra điền đủ chưa
          </button>
        </div>
      </section>

      <section className="card">
        <h3>1. Tóm tắt thông tin &amp; Kết quả đối chiếu vết</h3>
        <table className="trace-table">
          <tbody>
            <tr>
              <th style={{ width: '32%' }}>Mã học sinh (ẩn danh) / Bạn cùng cặp</th>
              <td>
                <strong>{ws.studentCode || '(Chưa ghi mã học sinh)'}</strong>
                {ws.partnerCode ? ` · Cặp với: ${ws.partnerCode}` : ''} · Lớp: {ws.classLabel || '…'} ·{' '}
                {SESSION_PHASES[ws.phase]}
              </td>
            </tr>
            <tr>
              <th>Bài tập</th>
              <td>
                <strong>{ch.title}</strong> ({ch.lessonRef})
              </td>
            </tr>
            <tr>
              <th>Trạng thái khóa bằng chứng (Phiếu A)</th>
              <td>
                {ws.predictionLocked
                  ? `Đã khóa dự đoán ban đầu lúc ${formatDateTime(ws.lockedAt)} · Đã mở ${ws.revealedCount}/${totalSteps} mốc`
                  : 'Chưa khóa dự đoán ban đầu'}
              </td>
            </tr>
            <tr>
              <th>Số mốc trạng thái dự đoán đúng</th>
              <td>
                <strong>
                  {correctSteps} / {totalSteps}
                </strong>{' '}
                mốc
              </td>
            </tr>
            <tr>
              <th>Dự đoán đầu ra cuối cùng</th>
              <td>
                Dự đoán: <code>{ws.predictedOutput || '(trống)'}</code>
                {ws.outputRevealed && (
                  <>
                    {' '}
                    · Chuẩn: <code>{ch.expectedOutput}</code> ({isOutputCorrect(ws) ? '✓ Đúng' : '✗ Lệch'})
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th>Giải thích quy tắc thực hiện lệnh (Phiếu A)</th>
              <td>{ws.orderExplanation || '(Chưa viết)'}</td>
            </tr>
            <tr>
              <th>Bước sai đầu tiên học sinh xác định (Phiếu B)</th>
              <td>
                <strong>{studentPickedWrongLabel}</strong>
                {ws.predictionLocked && ws.revealedCount >= totalSteps && ws.firstWrongStepId && (
                  <span>
                    {' '}
                    ({ws.firstWrongStepId === actualFirstWrong ? '✓ Khớp với bảng vết' : '⚠ Chưa khớp với bảng vết'})
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <th>Nguyên nhân sai lệch / Giải thích kiểm chứng (Phiếu B)</th>
              <td>{ws.wrongCauseExplanation || '(Chưa viết)'}</td>
            </tr>
            <tr>
              <th>Kết quả Vận dụng (Thay đổi đầu vào)</th>
              <td>
                Vết dự đoán: <code>{ws.variantPredictedTrace || '…'}</code> · Đầu ra dự đoán:{' '}
                <code>{ws.variantPredictedOutput || '…'}</code>
                {ws.variantRevealed && (
                  <>
                    {' '}
                    · Đầu ra chuẩn: <code>{ch.variantExpectedOutput}</code> (
                    {isVariantOutputCorrect(ws) ? '✓ Đúng' : '✗ Lệch'})
                  </>
                )}
              </td>
            </tr>
            {hasGrades && (
              <tr>
                <th>Điểm Rubric của giáo viên</th>
                <td>
                  <strong>{sumScores(ws.grading.scores)} / 10 điểm</strong> (
                  {TRACE_RUBRIC.map((r, i) => `${r.name.split('.')[0]}: ${ws.grading.scores[i] ?? '…'}/${r.max}`).join(
                    ' · ',
                  )}
                  ){ws.grading.note ? ` — Nhận xét: ${ws.grading.note}` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>2. Bảng đối chiếu chi tiết từng mốc điểm dừng</h3>
        <table className="trace-table">
          <thead>
            <tr>
              <th>Mốc điểm dừng</th>
              {ch.columns.map((c) => (
                <th key={c.key}>Dự đoán: {c.label}</th>
              ))}
              <th>Lí do &amp; Trao đổi cặp</th>
              <th>Kết quả mở vết</th>
            </tr>
          </thead>
          <tbody>
            {ch.steps.map((st, idx) => {
              const pred = ws.predictions[idx];
              const isRevealed = ws.predictionLocked && idx < ws.revealedCount;
              const ok = isStepCorrect(st, pred, ch.columns);
              return (
                <tr key={st.id}>
                  <td>
                    <strong>{st.label}</strong>
                  </td>
                  {ch.columns.map((c) => (
                    <td key={c.key}>
                      <code>{pred?.values[c.key] || '-'}</code>
                      {pred?.correctedValues[c.key] ? (
                        <div className="muted" style={{ fontSize: '0.8rem' }}>
                          Sửa: <strong>{pred.correctedValues[c.key]}</strong>
                        </div>
                      ) : null}
                    </td>
                  ))}
                  <td>
                    {pred?.reason || '—'}
                    {pred?.pairDiff && <div className="muted">[Cặp khác nhau: {pred.pairNote}]</div>}
                  </td>
                  <td>
                    {!isRevealed ? (
                      <span className="muted">Chưa mở</span>
                    ) : ok ? (
                      <span className="ok-text">✓ Khớp</span>
                    ) : (
                      <span className="err-text">
                        ✗ Lệch (Chuẩn: {ch.columns.map((c) => `${c.label}=${st.expected[c.key]}`).join(', ')})
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
