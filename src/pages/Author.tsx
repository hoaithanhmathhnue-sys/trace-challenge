import { AUTHOR_INFO } from '../auth';
import { TRACE_RUBRIC } from '../rubric';

export default function Author() {
  return (
    <div>
      <section className="card author-hero">
        <div className="author-profile">
          <img
            src={AUTHOR_INFO.avatarUrl}
            alt={`Giáo viên ${AUTHOR_INFO.name}`}
            className="author-avatar-lg"
            width={136}
            height={136}
          />
          <div className="author-info">
            <div className="row wrap" style={{ marginBottom: '0.35rem' }}>
              <span className="hero-tag">Hồ sơ Tác giả &amp; Biện pháp</span>
              <span className="badge cat-tin10_loop">Chương trình GDPT 2018</span>
            </div>
            <h1>Giáo viên: {AUTHOR_INFO.name}</h1>
            <p className="author-school">
              <strong>Đơn vị công tác:</strong> {AUTHOR_INFO.school}
            </p>
            <p className="author-addr">
              <strong>Địa chỉ:</strong> {AUTHOR_INFO.address}
            </p>
            <p className="author-topic">
              <strong>Đề tài / Biện pháp:</strong> {AUTHOR_INFO.topicTitle} —{' '}
              <em>"{AUTHOR_INFO.topicFull}"</em>
            </p>
          </div>
          <img
            src={AUTHOR_INFO.logoUrl}
            alt={`Biểu trưng ${AUTHOR_INFO.school}`}
            className="author-logo-lg"
            width={88}
            height={88}
          />
        </div>
      </section>

      <section className="card">
        <h2>1. Mục tiêu sư phạm và Phạm vi áp dụng</h2>
        <p>
          <strong>Phạm vi chương trình:</strong> {AUTHOR_INFO.scope}.
        </p>
        <p>
          <strong>Vấn đề thực tiễn:</strong> Trong dạy học lập trình Python ở bậc THPT, học sinh có thể đọc từng dòng lệnh nhưng thường gặp khó khăn khi theo dõi giá trị biến thay đổi qua thời gian (đặc biệt là phân biệt giá trị biến trước và sau phép gán, hoặc hiểu rõ vì sao hàm <code>range(a, b)</code> dừng trước cận trên <code>b</code>). Nếu học sinh chỉ đọc lướt hoặc bấm chạy mã ngay trên máy, giáo viên rất khó nhận biết các em thực sự hiểu quy tắc thực hiện lệnh hay chỉ ghi nhớ kết quả.
        </p>
        <p>
          <strong>Giải pháp cốt lõi của Trace Challenge:</strong> Yêu cầu học sinh{' '}
          <strong>dự đoán trạng thái biến trước khi chạy</strong>, giữ lại bằng chứng dự đoán ban đầu, trao đổi theo cặp, sau đó mới{' '}
          <strong>mở vết từng bước có kiểm soát</strong> để tự phát hiện và sửa <strong>bước đầu tiên có sai lệch</strong>.
        </p>
      </section>

      <section className="card">
        <h2>2. Quy trình tổ chức 6 bước trên lớp (45 phút)</h2>
        <table className="trace-table">
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Bước tổ chức</th>
              <th style={{ width: '16%' }}>Thời lượng gợi ý</th>
              <th>Hoạt động của Giáo viên và Học sinh trên Webapp / Phiếu giấy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>1. Chọn đoạn mã</strong>
              </td>
              <td>5 phút đầu tiết</td>
              <td>
                Giáo viên chọn đoạn mã ngắn 4–8 dòng chỉ sử dụng lệnh đã học, công bố rõ thời điểm đo (ví dụ: ngay sau lệnh gán trong thân vòng lặp) và câu hỏi đầu ra.
              </td>
            </tr>
            <tr>
              <td>
                <strong>2. Dự đoán cá nhân (Phiếu A)</strong>
              </td>
              <td>8 phút</td>
              <td>
                Học sinh tự điền bảng biến tại từng điểm dừng, ghi lí do cho mỗi giá trị quan trọng và dự đoán kết quả đầu ra trước khi khóa dự đoán. Nhóm cần hỗ trợ được bật gợi ý cột biến (<code>i</code>, <code>biến trước</code>, <code>biến sau</code>).
              </td>
            </tr>
            <tr>
              <td>
                <strong>3. Trao đổi cặp</strong>
              </td>
              <td>8 phút</td>
              <td>
                Hai học sinh so sánh bảng dự đoán, đánh dấu bước có kết quả khác nhau, giữ lại hai dự đoán khác nhau và cùng giải thích.
              </td>
            </tr>
            <tr>
              <td>
                <strong>4. Quan sát có kiểm soát</strong>
              </td>
              <td>10 phút</td>
              <td>
                Giáo viên hoặc học sinh lật mở từng trạng thái một trên webapp (hoặc lật từng thẻ vết trên bàn). Sau mỗi bước mở ra, đối chiếu ngay với dự đoán ban đầu.
              </td>
            </tr>
            <tr>
              <td>
                <strong>5. Sửa cách hiểu (Phiếu B)</strong>
              </td>
              <td>5 phút</td>
              <td>
                Học sinh xác định đúng <strong>bước đầu tiên trả lời sai</strong>, tự sửa bảng ở phần sửa lỗi (giữ nguyên bảng dự đoán ban đầu làm bằng chứng) và viết một câu giải thích nguyên nhân.
              </td>
            </tr>
            <tr>
              <td>
                <strong>6. Vận dụng &amp; Kiểm tra nhanh</strong>
              </td>
              <td>9 phút</td>
              <td>
                Thay đổi một giá trị đầu vào hoặc cận lặp (ví dụ đổi <code>range(1, 4)</code> thành <code>range(1, 5)</code> hoặc <code>range(2, 5)</code>); học sinh dự đoán độc lập trước khi mở đáp án vận dụng.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>3. Thang đánh giá Rubric 10 điểm</h2>
        <table className="trace-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Tiêu chí</th>
              <th style={{ width: '14%' }}>Điểm tối đa</th>
              <th>Nguyên tắc chấm điểm</th>
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
                <td>{r.levels[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row wrap" style={{ marginTop: '0.9rem' }}>
          <a className="btn primary" href="#/">
            ← Về trang Phiếu bài làm
          </a>
          <a className="btn" href="#/challenges">
            Mở Thư viện 7 bài tập mẫu
          </a>
          <a className="btn" href="#/print">
            Xem Tài liệu in &amp; Bộ thẻ vết
          </a>
        </div>
      </section>
    </div>
  );
}
