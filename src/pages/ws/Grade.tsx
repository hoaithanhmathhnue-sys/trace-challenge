import { Workspace, countCorrectSteps, detectActualFirstWrongStepId, isOutputCorrect } from '../../model';
import { RUBRIC_NOTE, TRACE_RUBRIC, isFullyGraded, suggestAutoScores, sumScores } from '../../rubric';
import { TextArea } from '../../components/ui';

interface Props {
  ws: Workspace;
  setScore: (idx: number, val: number | null) => void;
  setNote: (val: string) => void;
}

export default function Grade({ ws, setScore, setNote }: Props) {
  const ch = ws.challenge;
  const auto = suggestAutoScores(ws);
  const actualFirstWrong = detectActualFirstWrongStepId(ws);
  const total = sumScores(ws.grading.scores);

  const applyAutoSuggestion = () => {
    setScore(0, auto.stateScore);
    setScore(1, auto.outputScore);
  };

  return (
    <div>
      <section className="card">
        <div className="row between wrap">
          <div>
            <h2>Chấm điểm theo Rubric 10 điểm (Mục 5 &amp; Mục 8.4)</h2>
            <p className="muted">{RUBRIC_NOTE}</p>
          </div>
          <button type="button" className="btn small primary" onClick={applyAutoSuggestion}>
            ✨ Điền điểm gợi ý cho Tiêu chí 1 &amp; 2 từ kết quả đối chiếu
          </button>
        </div>

        <div className="teacher-hint" style={{ marginTop: '0.6rem' }}>
          <div>
            <strong>Tóm tắt bằng chứng tự động của phiếu này:</strong>
          </div>
          <ul>
            <li>
              <strong>Tiêu chí 1 (Trạng thái biến – tối đa 4đ):</strong> Học sinh dự đoán đúng hoàn toàn{' '}
              <strong>
                {countCorrectSteps(ws)} / {ch.steps.length}
              </strong>{' '}
              mốc trạng thái → Điểm quy đổi gợi ý: <strong>{auto.stateScore} / 4 điểm</strong>.
            </li>
            <li>
              <strong>Tiêu chí 2 (Dự đoán đầu ra – tối đa 2đ):</strong> Học sinh dự đoán{' '}
              <code>{ws.predictedOutput || '(trống)'}</code> so với chuẩn <code>{ch.expectedOutput}</code> (
              {isOutputCorrect(ws) ? '✓ Khớp' : '✗ Lệch'}) → Điểm gợi ý: <strong>{auto.outputScore} / 2 điểm</strong>.
            </li>
            <li>
              <strong>Tiêu chí 3 (Giải thích thứ tự thực hiện – tối đa 2đ):</strong> Nội dung học sinh viết:{' '}
              <em>"{ws.orderExplanation || '(chưa viết)'}"</em>
            </li>
            <li>
              <strong>Tiêu chí 4 (Phát hiện &amp; sửa bước sai đầu tiên – tối đa 2đ):</strong>{' '}
              {auto.firstWrongMatch
                ? '✓ Học sinh đã xác định ĐÚNG bước sai đầu tiên (hoặc xác nhận đúng vết không có bước sai).'
                : `⚠ Chưa khớp (Thực tế: ${actualFirstWrong === 'none' ? 'Không có bước sai' : ch.steps.find((s) => s.id === actualFirstWrong)?.label}).`}{' '}
              Giải thích ở Phiếu B: <em>"{ws.wrongCauseExplanation || '(chưa viết)'}"</em>
            </li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3>Bảng chấm Rubric (Thang 10 điểm)</h3>
        {TRACE_RUBRIC.map((crit, i) => {
          const opts: number[] = [];
          for (let v = crit.max; v >= 0; v -= 0.5) {
            opts.push(v);
          }
          const selectId = `rubric-crit-${i}`;
          return (
            <div key={crit.id} className="rubric-row">
              <div className="field">
                <label htmlFor={selectId}>
                  {crit.name} (Tối đa {crit.max} điểm)
                </label>
                <select
                  id={selectId}
                  value={ws.grading.scores[i] === null ? '' : String(ws.grading.scores[i])}
                  onChange={(e) => setScore(i, e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">— Chưa chấm —</option>
                  {opts.map((v) => (
                    <option key={v} value={v}>
                      {v} điểm
                    </option>
                  ))}
                </select>
              </div>
              <ul className="levels">
                {crit.levels.map((lv, k) => (
                  <li key={k}>{lv}</li>
                ))}
              </ul>
            </div>
          );
        })}

        <p className="total" aria-live="polite">
          Tổng điểm Rubric: <strong>{total}</strong> / 10{' '}
          {isFullyGraded(ws.grading.scores) ? (
            <span className="ok-text">(Đã chấm đủ 4 tiêu chí)</span>
          ) : (
            <span className="muted">(Còn tiêu chí chưa chấm)</span>
          )}
        </p>

        <TextArea
          label="Nhận xét và phản hồi của giáo viên"
          hint="Ví dụ: Em đã nắm chắc quy tắc cận trên của range(1, 4), cần chú ý ghi rõ giá trị biến trước phép gán..."
          value={ws.grading.note}
          rows={3}
          max={3000}
          onChange={setNote}
        />
      </section>
    </div>
  );
}
