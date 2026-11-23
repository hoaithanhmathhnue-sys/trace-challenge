import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useApp } from './ctx';
import { useRoute } from './router';
import { TabId } from './validate';
import Home from './pages/Home';
import Challenges from './pages/Challenges';
import ChallengeEditor from './pages/ChallengeEditor';
import WorkspacePage from './pages/Workspace';
import PrintDocs, { ChallengeHandout } from './pages/PrintDocs';

const TAB_IDS: TabId[] = ['predict', 'trace', 'reflect', 'export', 'grade'];

export default function App() {
  const { parts, query } = useRoute();
  const { prefs, setPrefs, needRefresh, applyUpdate, registerUpdate, toast } = useApp();
  const [a, b, c] = parts;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [a, b, c]);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        registerUpdate(() => void update(true));
      },
      onOfflineReady() {
        toast('Ứng dụng đã sẵn sàng hoạt động ngay cả khi không có Internet.');
      },
    });
  }, [registerUpdate, toast]);

  let page;
  if (a === 'ws' && b) {
    const tab = (TAB_IDS.includes(c as TabId) ? c : 'predict') as TabId;
    page = <WorkspacePage key={b} id={b} tab={tab} focusStep={query.get('s') ?? ''} />;
  } else if (a === 'challenges' && b === 'edit' && c) {
    page = <ChallengeEditor key={c + (query.get('from') ?? '')} id={c} from={query.get('from') ?? ''} />;
  } else if (a === 'challenges' && b === 'print' && c) {
    page = <ChallengeHandout id={c} />;
  } else if (a === 'challenges') {
    page = <Challenges />;
  } else if (a === 'print') {
    page = <PrintDocs />;
  } else {
    page = <Home />;
  }

  return (
    <>
      <a
        className="skip no-print"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Bỏ qua điều hướng, tới nội dung chính
      </a>
      <header className="top no-print">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">
            ◈
          </span>{' '}
          Trace Challenge
        </a>
        <nav aria-label="Điều hướng chính">
          <a href="#/" aria-current={!a ? 'page' : undefined}>
            Phiếu bài làm
          </a>
          <a href="#/challenges" aria-current={a === 'challenges' ? 'page' : undefined}>
            Chọn bài (Thư viện mã)
          </a>
          <a href="#/print" aria-current={a === 'print' ? 'page' : undefined}>
            Tài liệu in &amp; Thẻ vết
          </a>
        </nav>
        <div className="modes">
          <label className="check inline">
            <input
              type="checkbox"
              checked={prefs.scaffolding}
              onChange={(e) => setPrefs({ scaffolding: e.target.checked })}
            />
            <span title="Hiện hướng dẫn ý nghĩa từng cột biến cho nhóm học sinh cần hỗ trợ">Hỗ trợ cột biến</span>
          </label>
          <label className="check inline">
            <input
              type="checkbox"
              checked={prefs.teacher}
              onChange={(e) => setPrefs({ teacher: e.target.checked })}
            />
            <span title="Bật bảng chấm Rubric 10 điểm và ghi chú sư phạm cho giáo viên (không phải khóa bảo mật)">
              Chế độ giáo viên
            </span>
          </label>
          <label className="check inline">
            <input
              type="checkbox"
              checked={prefs.projector}
              onChange={(e) => setPrefs({ projector: e.target.checked })}
            />
            <span>Chữ lớn (Chiếu)</span>
          </label>
        </div>
      </header>

      {needRefresh && (
        <div className="banner no-print" role="status">
          Đã có phiên bản mới của ứng dụng. Dữ liệu phiếu của bạn đã được lưu an toàn.{' '}
          <button className="btn small primary" onClick={applyUpdate}>
            Cập nhật ngay
          </button>
        </div>
      )}

      <main id="main" tabIndex={-1}>
        {page}
      </main>

      <footer className="foot no-print">
        <strong>Trace Challenge – Dự đoán đường đi của thuật toán</strong> (Biện pháp 02 · Tin học 10: Rẽ nhánh, Vòng lặp · Tin học 11 CS: Tìm kiếm, Sắp xếp). Ứng dụng đối chiếu dự đoán của học sinh với bảng vết chuẩn do giáo viên biên soạn; không tuyên bố phân tích tự động mọi chương trình Python bất kỳ. Dữ liệu lưu cục bộ trên trình duyệt; hãy tải file sao lưu (.json) hoặc xuất Word (.docx) trước khi đóng trình duyệt ở máy phòng tin dùng chung.
      </footer>
    </>
  );
}
