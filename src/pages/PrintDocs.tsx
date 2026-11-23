import { BUILT_IN_CHALLENGES } from '../challenges';
import { store } from '../ctx';
import { CategoryBadge } from '../components/ui';
import { RUBRIC_NOTE, TRACE_RUBRIC } from '../rubric';

const dots = (n = 2) => Array.from({ length: n }, (_, i) => <div key={i} className="line" />);

/**
 * In bản phát cho 1 bài tập cụ thể:
 * - Trang 1: Phiếu A & Phiếu B có in sẵn đoạn mã và đúng các cột biến của bài đó.
 * - Trang 2: Bộ thẻ vết cắt rời (Mục 8.6: "Khi thiếu máy, in thẻ vết úp và lật từng thẻ").
 */
export function ChallengeHandout({ id }: { id: string }) {
  const ch = [...BUILT_IN_CHALLENGES, ...store.loadChallenges()].find((x) => x.id === id);
  if (!ch) return <p className="card">Không tìm thấy bài tập.</p>;

  return (
    <div>
      <div className="no-print row wrap card">
        <button className="btn primary" onClick={() => window.print()}>
          🖨 In Phiếu bài tập &amp; Bộ thẻ vết úp–lật (A4)
        </button>
        <a className="btn" href="#/challenges">
          ← Về thư viện bài tập
        </a>
      </div>

      <article className="sheet print-page">
        <h1>PHIẾU HỌC TẬP TRACE CHALLENGE (PHIẾU A &amp; PHIẾU B)</h1>
        <p>
          Mã học sinh (ẩn danh): ……………………… Bạn cùng cặp: ……………………… Lớp: ………… Loại phiếu: ☐ Trước &nbsp; ☐ Sau &nbsp; ☐ Luyện tập
        </p>
        <p>
          <strong>Bài tập:</strong> {ch.title} &nbsp; <CategoryBadge category={ch.category} />
        </p>
        <p>
          <strong>Mục đích:</strong> {ch.purpose}
        </p>
        <p>
          <strong>Thời điểm đo:</strong> {ch.measureRule}
        </p>
        <pre className="print-code">{ch.code}</pre>

        <h2>Phần 1 (Phiếu A) – Dự đoán cá nhân và Trao đổi cặp trước khi mở thẻ vết</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Thời điểm / Điểm dừng</th>
              {ch.columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Lí do dự đoán / Khoanh nếu khác bạn cùng cặp</th>
            </tr>
          </thead>
          <tbody>
            {ch.steps.map((st) => (
              <tr key={st.id}>
                <td>
                  <strong>{st.label}</strong> (dòng {st.lineNo})
                </td>
                {ch.columns.map((c) => (
                  <td key={c.key} style={{ height: '2.1rem' }} />
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong>Dự đoán đầu ra cuối cùng (print):</strong> …………………………… &nbsp; <strong>Bước dễ nhầm nhất:</strong> ………………………………
        </p>
        <p>
          <strong>Giải thích quy tắc thực hiện lệnh (ví dụ vì sao range dừng trước cận trên, lệnh gán dùng giá trị cũ hay mới):</strong>
        </p>
        {dots(2)}

        <h2>Phần 2 (Phiếu B) – Đối chiếu sau khi lật thẻ vết, sửa bước sai đầu tiên &amp; Vận dụng</h2>
        <p>
          <em>(Lưu ý Mục 8.3: Giữ nguyên dự đoán ban đầu ở Phần 1 làm bằng chứng, chỉ ghi kết quả đối chiếu và sửa lỗi vào Phần 2).</em>
        </p>
        <p>
          <strong>Kết quả đầu ra thực tế:</strong> ……………… &nbsp; <strong>Bước đầu tiên dự đoán sai:</strong> ……………………………………… (hoặc ☐ Không có bước sai)
        </p>
        <p>
          <strong>Nguyên nhân sai lệch và giá trị sửa lại (hoặc giải thích vì sao vết đúng hoàn toàn):</strong>
        </p>
        {dots(2)}
        <p>
          <strong>Câu hỏi Vận dụng:</strong> {ch.variantPrompt}
        </p>
        <p>
          Dự đoán dãy trạng thái mới: …………………………………… &nbsp; Dự đoán đầu ra mới: ……………………… &nbsp; Giải thích ngắn: ……………………………………
        </p>
      </article>

      <article className="sheet print-page">
        <h1>BỘ THẺ VẾT CẮT RỜI (ÚP VÀ LẬT TỪNG THẺ KHI THIẾU MÁY – MỤC 8.6)</h1>
        <p className="muted">
          Hướng dẫn cho giáo viên: Cắt rời các thẻ theo đường nét đứt, phát cho mỗi cặp học sinh một bộ thẻ đang úp. Học sinh chỉ được lật từng thẻ theo thứ tự Mốc 0 → Mốc cuối sau khi đã hoàn thành bảng dự đoán ở Phiếu A.
        </p>
        <div className="flashcards-grid">
          {ch.steps.map((st, idx) => (
            <div key={st.id} className="flashcard">
              <div className="flashcard-head">
                <strong>
                  THẺ VẾT {idx + 1}/{ch.steps.length}: {st.label}
                </strong>
                <span>Dòng {st.lineNo}</span>
              </div>
              <div className="flashcard-q">
                <em>Câu hỏi gợi ý (đọc trước khi lật):</em> {st.guidingQuestion || 'Lệnh gán này dùng giá trị cũ hay mới?'}
              </div>
              <div className="flashcard-a">
                <strong>Trạng thái chuẩn:</strong>{' '}
                {ch.columns.map((c) => `${c.label} = ${st.expected[c.key]}`).join('  |  ')}
              </div>
              <div className="flashcard-exp">
                <strong>Giải thích:</strong> {st.explanation}
              </div>
            </div>
          ))}
          <div className="flashcard">
            <div className="flashcard-head">
              <strong>THẺ ĐẦU RA CUỐI CÙNG &amp; ĐÁP ÁN VẬN DỤNG</strong>
              <span>Chỉ lật cuối cùng</span>
            </div>
            <div className="flashcard-a">
              <strong>Đầu ra chuẩn (print):</strong> <code>{ch.expectedOutput}</code>
            </div>
            <div className="flashcard-exp">
              <strong>Giải thích đầu ra:</strong> {ch.outputExplanation}
            </div>
            <div className="flashcard-exp" style={{ marginTop: '0.3rem', borderTop: '1px dashed #888', paddingTop: '0.3rem' }}>
              <strong>Đáp án Vận dụng:</strong> Vết mới: <code>{ch.variantExpectedTrace}</code> · Đầu ra mới:{' '}
              <code>{ch.variantExpectedOutput}</code> ({ch.variantExplanation})
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/** Trang Tài liệu in tổng hợp: Phiếu A trắng, Phiếu B trắng, Rubric 10 điểm và Mẫu tổng hợp sau dạy (Mục 7). */
export default function PrintDocs() {
  return (
    <div>
      <div className="no-print card">
        <h1>Tài liệu in &amp; Thẻ vết (Phương án dùng phiếu giấy khi không có máy)</h1>
        <p className="muted">
          Đáp ứng Mục 4, Mục 8.4 và Mục 8.6 của Biện pháp 02: Khi phòng học không có máy tính hoặc mất kết nối, giáo viên in sẵn Phiếu A, Phiếu B, Rubric 10 điểm và Bộ thẻ vết úp–lật.
        </p>
        <div className="row wrap">
          <button className="btn primary" onClick={() => window.print()}>
            🖨 In toàn bộ bộ mẫu (Phiếu A, Phiếu B, Rubric 10đ, Mẫu tổng hợp sau dạy)
          </button>
          <a className="btn" href="#/challenges/print/tc-for-sum-14">
            In Phiếu &amp; Thẻ vết Bài mẫu Tiết 1: range(1, 4)
          </a>
          <a className="btn" href="#/challenges/print/tc-for-prod-14">
            In Phiếu &amp; Thẻ vết Bài mẫu Tiết 2: Phép nhân
          </a>
        </div>
      </div>

      <article className="sheet print-page">
        <h1>Phiếu A – Dự đoán trạng thái biến trước khi chạy (Mẫu chung)</h1>
        <p>
          Mã học sinh (ẩn danh): ……………………… Bạn cùng cặp: ……………………… Lớp: ………… Ngày: ………………
        </p>
        <ol className="form">
          <li>
            <strong>Đoạn mã theo dõi &amp; Mục đích của đoạn mã:</strong>
            {dots(3)}
          </li>
          <li>
            <strong>Dự đoán đầu ra ban đầu (trước khi mở vết):</strong> …………………………………………………………………
          </li>
          <li>
            <strong>Bảng dự đoán trạng thái biến (Ghi rõ thời điểm đo là ngay sau lệnh gán trong vòng lặp):</strong>
            <table style={{ marginTop: '0.4rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Lượt / Thời điểm</th>
                  <th style={{ width: '14%' }}>Biến lặp i</th>
                  <th style={{ width: '18%' }}>Biến trước lệnh</th>
                  <th style={{ width: '18%' }}>Biến sau lệnh</th>
                  <th>Lí do / Khoanh nếu khác bạn cùng cặp</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Trước vòng lặp</td>
                  <td style={{ height: '2rem' }} />
                  <td />
                  <td />
                  <td />
                </tr>
                <tr>
                  <td>Sau lượt 1</td>
                  <td style={{ height: '2rem' }} />
                  <td />
                  <td />
                  <td />
                </tr>
                <tr>
                  <td>Sau lượt 2</td>
                  <td style={{ height: '2rem' }} />
                  <td />
                  <td />
                  <td />
                </tr>
                <tr>
                  <td>Sau lượt 3</td>
                  <td style={{ height: '2rem' }} />
                  <td />
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </li>
          <li>
            <strong>Bước dễ nhầm nhất:</strong> ……………………………………………………………………………………………………
          </li>
          <li>
            <strong>Giải thích thứ tự và quy tắc thực hiện lệnh (vì sao range dừng trước cận trên, lệnh gán dùng giá trị cũ hay mới):</strong>
            {dots(2)}
          </li>
        </ol>
      </article>

      <article className="sheet print-page">
        <h1>Phiếu B – Phản hồi sau khi mở vết, sửa bước sai đầu tiên &amp; Vận dụng</h1>
        <p>
          Mã học sinh (ẩn danh): ……………………… Lớp: ………… (Không sửa lại dự đoán ban đầu ở Phiếu A để giữ bằng chứng)
        </p>
        <ol className="form">
          <li>
            <strong>Kết quả thực tế sau khi mở từng bước vết:</strong> Đầu ra thực tế: …………………… Số mốc dự đoán đúng: ……… / ………
          </li>
          <li>
            <strong>Bước đầu tiên có sai lệch so với bảng vết chuẩn:</strong>
            <div>☐ Mốc 0 (Trước vòng lặp) &nbsp; ☐ Lượt 1 &nbsp; ☐ Lượt 2 &nbsp; ☐ Lượt 3 &nbsp; ☐ Không có bước sai (dự đoán ban đầu khớp toàn bộ)</div>
          </li>
          <li>
            <strong>Giá trị sửa lại từ bước sai đầu tiên:</strong>
            {dots(2)}
          </li>
          <li>
            <strong>Nguyên nhân dẫn đến sai lệch (hoặc giải thích vì sao vết của em không có bước sai):</strong>
            {dots(2)}
          </li>
          <li>
            <strong>Vận dụng – Dự đoán độc lập khi thay đổi một giá trị đầu vào / cận trên (ví dụ đổi range(1, 4) thành range(1, 5)):</strong>
            <div>Dãy giá trị trạng thái mới sau mỗi lượt: ……………………………………………………………………………………</div>
            <div>Dự đoán đầu ra mới: ………………………… Giải thích: ……………………………………………………………………</div>
          </li>
        </ol>
      </article>

      <article className="sheet print-page">
        <h1>Rubric đánh giá Trace Challenge – Thang 10 điểm (Mục 5 &amp; Mục 8.4)</h1>
        <table>
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Tiêu chí đánh giá</th>
              <th style={{ width: '10%' }}>Điểm tối đa</th>
              <th>Mô tả mức độ đạt được</th>
            </tr>
          </thead>
          <tbody>
            {TRACE_RUBRIC.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.name}</strong>
                </td>
                <td>
                  <strong>{r.max} điểm</strong>
                </td>
                <td>
                  {r.levels.map((lv, i) => (
                    <div key={i}>{lv}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">{RUBRIC_NOTE}</p>

        <h2 style={{ marginTop: '1.2rem' }}>Mẫu tổng hợp sau dạy dành cho giáo viên (Mục 7 &amp; Mục 8.6)</h2>
        <p className="muted">Chỉ điền số liệu sau khi đã tổ chức thực nghiệm trên lớp; không suy rộng khi chưa thử ở bối cảnh khác.</p>
        <table>
          <tbody>
            <tr>
              <th style={{ width: '35%' }}>Lớp / Thời gian thực hiện</th>
              <td>Lớp: [ ……………… ] &nbsp;&nbsp; Thời gian: [ ……………………………… ]</td>
            </tr>
            <tr>
              <th>Số phiếu hợp lệ thu được</th>
              <td>[ ……………… ] phiếu (Lưu bằng mã học sinh ẩn danh, không công khai họ tên)</td>
            </tr>
            <tr>
              <th>Số dự đoán đúng đầu ra Trước và Sau</th>
              <td>Đề Trước: [ ……… / ……… ] &nbsp;&nbsp;|&nbsp;&nbsp; Đề Sau: [ ……… / ……… ]</td>
            </tr>
            <tr>
              <th>Số học sinh xác định đúng bước sai đầu tiên</th>
              <td>[ ……… / ……… ] học sinh</td>
            </tr>
            <tr>
              <th>Lỗi phổ biến ghi nhận qua bảng vết</th>
              <td style={{ height: '2.8rem' }} />
            </tr>
            <tr>
              <th>Điều chỉnh cho bài dạy kế tiếp</th>
              <td style={{ height: '2.8rem' }} />
            </tr>
          </tbody>
        </table>
      </article>
    </div>
  );
}
