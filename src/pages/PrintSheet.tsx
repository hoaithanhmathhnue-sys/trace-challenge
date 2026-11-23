import {
  SESSION_PHASES,
  TOPIC_CATEGORIES,
  Workspace,
  countCorrectSteps,
  detectActualFirstWrongStepId,
  isOutputCorrect,
  isStepCorrect,
} from '../model';
import { TRACE_RUBRIC, sumScores } from '../rubric';
import { formatDateTime } from '../text';

/** Bản in A4 của một phiếu bài làm cụ thể (chỉ dựng khi bấm "In phiếu"). */
export default function PrintSheet({ ws }: { ws: Workspace }) {
  const ch = ws.challenge;
  const actualFirstWrong = detectActualFirstWrongStepId(ws);
  const hasGrades = ws.grading.scores.some((s) => s !== null);

  return (
    <article className="print-only sheet">
      <h1>PHIẾU HỌC TẬP TRACE CHALLENGE – DỰ ĐOÁN ĐƯỜNG ĐI CỦA THUẬT TOÁN</h1>
      <p>
        <strong>Mã học sinh:</strong> {ws.studentCode || '(chưa ghi)'} &nbsp; <strong>Bạn cùng cặp:</strong>{' '}
        {ws.partnerCode || '…'} &nbsp; <strong>Lớp:</strong> {ws.classLabel || '…'} &nbsp;{' '}
        <strong>Loại phiếu:</strong> {SESSION_PHASES[ws.phase]} &nbsp; <strong>In lúc:</strong>{' '}
        {formatDateTime(Date.now())}
      </p>
      <p>
        <strong>Bài tập:</strong> {ch.title} ({TOPIC_CATEGORIES[ch.category]} – {ch.lessonRef})
      </p>
      <p>
        <strong>Mục đích:</strong> {ch.purpose} · <strong>Thời điểm đo:</strong> {ch.measureRule}
      </p>
      <pre className="print-code">{ch.code}</pre>

      <h2>1. Phiếu A – Bảng dự đoán trạng thái biến và đối chiếu vết</h2>
      <table>
        <thead>
          <tr>
            <th>Mốc điểm dừng</th>
            {ch.columns.map((c) => (
              <th key={c.key}>Dự đoán: {c.label}</th>
            ))}
            <th>Lí do &amp; Trao đổi cặp</th>
            <th>Kết quả mở vết &amp; Đối chiếu</th>
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
                    {pred?.values[c.key] || '-'}
                    {pred?.correctedValues[c.key] ? ` (Sửa: ${pred.correctedValues[c.key]})` : ''}
                  </td>
                ))}
                <td>
                  {pred?.reason || ''}
                  {pred?.pairDiff ? ` [Cặp khác nhau: ${pred.pairNote}]` : ''}
                </td>
                <td>
                  {!isRevealed
                    ? 'Chưa mở'
                    : ok
                      ? '✓ Khớp hoàn toàn'
                      : `✗ Lệch${st.id === actualFirstWrong ? ' (Bước sai đầu tiên)' : ''}. Chuẩn: ${ch.columns
                          .map((c) => `${c.label}=${st.expected[c.key]}`)
                          .join(', ')}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p>
        <strong>Dự đoán đầu ra ban đầu:</strong> {ws.predictedOutput || '(chưa điền)'}
        {ws.outputRevealed && (
          <>
            {' '}
            &nbsp;|&nbsp; <strong>Đầu ra thực tế:</strong> {ch.expectedOutput} (
            {isOutputCorrect(ws) ? '✓ Đúng' : '✗ Sai'})
          </>
        )}
      </p>
      <p>
        <strong>Giải thích thứ tự và quy tắc thực hiện lệnh:</strong> {ws.orderExplanation || '(chưa viết)'}
      </p>

      <h2>2. Phiếu B – Phát hiện bước sai đầu tiên, tự sửa và Vận dụng</h2>
      <p>
        <strong>Bước sai đầu tiên xác định:</strong>{' '}
        {ws.firstWrongStepId === 'none'
          ? 'Không có bước sai (dự đoán ban đầu khớp toàn bộ)'
          : ch.steps.find((s) => s.id === ws.firstWrongStepId)?.label || '(chưa chọn)'}
      </p>
      <p>
        <strong>Nguyên nhân sai lệch / Giải thích kiểm chứng:</strong> {ws.wrongCauseExplanation || '(chưa viết)'}
      </p>
      <p>
        <strong>Vận dụng ({ch.variantPrompt}):</strong> Dự đoán vết mới: {ws.variantPredictedTrace || '…'} &nbsp;|&nbsp;
        Dự đoán đầu ra mới: {ws.variantPredictedOutput || '…'}
        {ws.variantRevealed ? ` (Chuẩn: ${ch.variantExpectedOutput})` : ''}
      </p>
      <p>
        <strong>Giải thích vận dụng:</strong> {ws.variantExplanation || '(chưa viết)'}
      </p>

      {hasGrades && (
        <>
          <h2>3. Đánh giá theo Rubric 10 điểm (Giáo viên)</h2>
          <p>
            {TRACE_RUBRIC.map((r, i) => `${r.name}: ${ws.grading.scores[i] ?? '…'}/${r.max}`).join('  |  ')} &nbsp;→&nbsp;{' '}
            <strong>Tổng: {sumScores(ws.grading.scores)} / 10 điểm</strong>
          </p>
          {ws.grading.note && <p>Nhận xét: {ws.grading.note}</p>}
        </>
      )}

      <p className="print-foot">
        Bằng chứng tự động: Đúng {countCorrectSteps(ws)}/{ch.steps.length} mốc trạng thái. Trace Challenge – Dự đoán đường đi của thuật toán (Biện pháp 02).
      </p>
    </article>
  );
}
