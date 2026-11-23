import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AUTHOR_INFO } from '../auth';
import { BUILT_IN_CHALLENGES } from '../challenges';
import { store, useApp } from '../ctx';
import { IndexItem, backupFileName, exportJson, parseImport } from '../storage';
import { LIMITS, SESSION_PHASES, SessionPhase, newWorkspace } from '../model';
import { PhaseBadge } from '../components/ui';
import { downloadText } from '../download';
import { formatDateTime } from '../text';
import { go } from '../router';
import { allowDelete } from '../guard';

export default function Home() {
  const { prefs, toast } = useApp();
  const [items, setItems] = useState<IndexItem[]>([]);
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [showSummary, setShowSummary] = useState(false);
  const [commonErrorsNote, setCommonErrorsNote] = useState('');
  const [nextAdjustNote, setNextAdjustNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(() => setItems(store.reconcile()), []);
  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, [refresh]);

  const startQuick = (challengeId: string, phase: SessionPhase = 'practice') => {
    if (items.length >= LIMITS.workspaces) {
      toast('Đã có quá nhiều phiếu trên máy này. Hãy xóa bớt các phiếu cũ.');
      return;
    }
    const ch = BUILT_IN_CHALLENGES.find((c) => c.id === challengeId) ?? BUILT_IN_CHALLENGES[0];
    const ws = newWorkspace(ch, phase);
    const r = store.saveWorkspace(ws, 0, true);
    if (!r.ok) {
      toast('Không lưu được phiếu mới (bộ nhớ trình duyệt đầy hoặc bị chặn).');
      return;
    }
    go(`/ws/${ws.id}/predict`);
  };

  const backup = (id: string) => {
    const ws = store.loadWorkspace(id);
    if (!ws) return toast('Không đọc được phiếu này.');
    downloadText(exportJson(ws), backupFileName(ws));
  };

  const remove = (id: string) => {
    if (!allowDelete()) return;
    const ws = store.loadWorkspace(id);
    if (!ws) {
      refresh();
      return;
    }
    store.deleteWorkspace(id);
    refresh();
    toast(`Đã xóa phiếu "${ws.studentCode || ws.challenge.title}"`, () => {
      store.saveWorkspace(ws, ws.rev, true);
      refresh();
    });
  };

  const clearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 6000);
      return;
    }
    const n = store.clearAllWorkspaces();
    setConfirmClear(false);
    refresh();
    toast(`Đã xóa ${n} phiếu khỏi máy này. Các file sao lưu đã tải về máy vẫn an toàn.`);
  };

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    let ok = 0;
    const errs: string[] = [];
    for (const f of files.slice(0, 60)) {
      if (f.size > LIMITS.importBytes) {
        errs.push(`${f.name}: quá 1 MB`);
        continue;
      }
      const r = parseImport(await f.text(), f.size);
      if (!r.ok) {
        errs.push(`${f.name}: ${r.error}`);
        continue;
      }
      const s = store.importWorkspace(r.workspace);
      if (s.ok) ok++;
      else errs.push(`${f.name}: bộ nhớ đầy`);
    }
    refresh();
    toast(`Đã nhập ${ok} phiếu${errs.length ? `. Lỗi: ${errs.slice(0, 2).join('; ')}` : ''}`);
  };

  const filteredItems = useMemo(
    () => (filterPhase === 'all' ? items : items.filter((it) => it.phase === filterPhase)),
    [items, filterPhase],
  );

  // Thống kê cho Mẫu tổng hợp sau dạy (Mục 7 & 8.6): chỉ tính từ các phiếu đã khóa dự đoán trên máy
  const stats = useMemo(() => {
    const valid = items.filter((it) => it.predictionLocked);
    const pre = valid.filter((it) => it.phase === 'pre');
    const post = valid.filter((it) => it.phase === 'post');
    const practice = valid.filter((it) => it.phase === 'practice');
    const classes = Array.from(new Set(valid.map((it) => it.classLabel.trim()).filter(Boolean)));
    return {
      totalValid: valid.length,
      classesText: classes.length ? classes.join(', ') : '[Chưa điền]',
      preTotal: pre.length,
      preOutOk: pre.filter((it) => it.outputCorrect).length,
      preFirstWrongOk: pre.filter((it) => it.firstWrongMatched).length,
      postTotal: post.length,
      postOutOk: post.filter((it) => it.outputCorrect).length,
      postFirstWrongOk: post.filter((it) => it.firstWrongMatched).length,
      practiceTotal: practice.length,
      practiceOutOk: practice.filter((it) => it.outputCorrect).length,
      allFirstWrongOk: valid.filter((it) => it.firstWrongMatched).length,
    };
  }, [items]);

  return (
    <div>
      <section className="hero card">
        <div className="hero-tag">Biện pháp 02 · Tin học 10 (Rẽ nhánh, Vòng lặp) &amp; Tin học 11 CS (Tìm kiếm, Sắp xếp)</div>
        <h1>Trace Challenge – Dự đoán đường đi của thuật toán</h1>
        <p>
          Học sinh <strong>dự đoán bảng trạng thái biến trước khi chạy</strong>, trao đổi theo cặp, sau đó mới{' '}
          <strong>lật mở từng bước vết</strong> để đối chiếu và chỉ ra <strong>bước đầu tiên làm lệch dự đoán</strong>.
          Không mở đáp án trước khi khóa bằng chứng dự đoán ban đầu.
        </p>
        <div className="row wrap">
          <button className="btn primary big" onClick={() => startQuick('tc-for-sum-14', 'practice')}>
            ▶ Bắt đầu Bài mẫu Tiết 1: range(1, 4) tính tổng
          </button>
          <button className="btn big" onClick={() => startQuick('tc-for-prod-14', 'practice')}>
            Bài mẫu Tiết 2: Phép nhân &amp; đổi cận
          </button>
          <a className="btn big" href="#/challenges">
            Chọn từ 7 bài mẫu / Soạn bài mới
          </a>
        </div>
        <div className="row wrap" style={{ marginTop: '0.6rem' }}>
          <span className="muted">Đánh giá Trước–Sau (Mục 8.5):</span>
          <button className="btn small" onClick={() => startQuick('tc-for-sum-14', 'pre')}>
            + Tạo phiếu Đề Trước: range(1, 4)
          </button>
          <button className="btn small" onClick={() => startQuick('tc-for-sum-25', 'post')}>
            + Tạo phiếu Đề Sau: range(2, 5)
          </button>
        </div>
      </section>

      <section className="card">
        <div className="row between wrap">
          <h2>Phiếu bài làm trên máy này ({items.length})</h2>
          <div className="row wrap">
            <select
              aria-label="Lọc theo loại phiếu"
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              style={{ width: 'auto', minHeight: '38px', padding: '0.2rem 0.6rem' }}
            >
              <option value="all">Tất cả loại phiếu ({items.length})</option>
              {Object.entries(SESSION_PHASES).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn small" onClick={() => fileRef.current?.click()}>
              Nhập file sao lưu (.json)
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              multiple
              hidden
              onChange={onFiles}
              aria-label="Chọn file sao lưu để nhập"
            />
          </div>
        </div>

        {!store.persistent && (
          <p className="banner bad" role="alert">
            Trình duyệt đang chặn lưu dữ liệu cục bộ (chế độ riêng tư hoặc cấu hình phòng máy). Phiếu chỉ giữ đến khi đóng trang. Hãy tải file sao lưu (.json) hoặc xuất Word sau khi làm xong.
          </p>
        )}

        {filteredItems.length === 0 ? (
          <p className="empty">
            Chưa có phiếu nào trong mục này. Bấm "Bắt đầu Bài mẫu Tiết 1" hoặc chọn một bài trong Thư viện mã để tạo phiếu dự đoán mới.
          </p>
        ) : (
          <ul className="ws-list">
            {filteredItems.map((it) => (
              <li key={it.id} className="ws-item">
                <div>
                  <div className="row wrap">
                    <a className="ws-name" href={`#/ws/${it.id}/predict`}>
                      {it.studentCode || '(Chưa ghi mã học sinh)'}
                    </a>
                    {it.classLabel && <span className="badge muted">Lớp {it.classLabel}</span>}
                    <PhaseBadge phase={it.phase} />
                    {it.predictionLocked ? (
                      <span className="badge match-ok">Đã khóa dự đoán · Mở {it.revealedCount}/{it.totalSteps} mốc</span>
                    ) : (
                      <span className="badge locked">Đang điền dự đoán (Phiếu A)</span>
                    )}
                    {it.totalScore !== null && <span className="badge score-badge">Rubric: {it.totalScore}/10</span>}
                  </div>
                  <div className="muted">
                    {it.challengeTitle}
                    {it.predictionLocked && (
                      <>
                        {' · '}Đúng {it.correctSteps}/{it.totalSteps} mốc · Đầu ra: {it.outputCorrect ? '✓ Đúng' : '✗ Lệch'}
                        {it.firstWrongMatched ? ' · ✓ Xác định đúng bước sai đầu tiên' : ''}
                      </>
                    )}
                    {' · '}Sửa lúc {formatDateTime(it.updatedAt)}
                  </div>
                </div>
                <div className="row wrap">
                  <a className="btn small primary" href={`#/ws/${it.id}/${it.predictionLocked ? 'trace' : 'predict'}`}>
                    Mở phiếu
                  </a>
                  <button className="btn small" onClick={() => backup(it.id)}>
                    Tải .json
                  </button>
                  <button className="btn small danger" onClick={() => remove(it.id)}>
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="banner" role="note">
            <strong>Lưu ý phòng máy dùng chung:</strong> Cuối tiết học, học sinh tải file sao lưu (.json) hoặc xuất Word (.docx) để nộp, sau đó xóa phiếu trên máy để nhóm tiết sau không nhìn thấy kết quả.{' '}
            <button className={`btn small ${confirmClear ? 'danger' : ''}`} onClick={clearAll}>
              {confirmClear ? 'Xác nhận xóa TẤT CẢ phiếu trên máy này' : 'Xóa tất cả phiếu trên máy này'}
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="row between wrap">
          <h2>Mẫu tổng hợp sau dạy (Mục 7 &amp; Mục 8.6)</h2>
          <button className="btn small" onClick={() => setShowSummary((s) => !s)} aria-expanded={showSummary}>
            {showSummary ? 'Thu gọn bảng tổng hợp' : 'Mở mẫu tổng hợp sau dạy'}
          </button>
        </div>
        <p className="muted">
          Giáo viên có thể nhập nhiều file <code>.json</code> của học sinh vào máy để tổng hợp nhanh số phiếu hợp lệ, số dự đoán đúng đầu ra trước–sau và số học sinh xác định đúng bước sai đầu tiên.{' '}
          <strong>Nguyên tắc Mục 7: Không điền số liệu khi chưa thực hiện thực nghiệm trên lớp.</strong>
        </p>
        {showSummary && (
          <div className="summary-box">
            {stats.totalValid === 0 ? (
              <div className="note-box">
                <p>
                  <strong>Mẫu ghi nhận trống (khi chưa thực hiện hoặc chưa nhập phiếu đã khóa dự đoán):</strong>
                </p>
                <p>
                  Lớp: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> · Thời gian: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> · Số phiếu hợp lệ: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> · Số dự đoán đúng đầu ra Trước: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> và Sau: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> · Số xác định đúng bước sai đầu tiên: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> · Lỗi phổ biến: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong> · Điều chỉnh cho bài kế tiếp: <strong>[ &nbsp;&nbsp;&nbsp; ]</strong>.
                </p>
              </div>
            ) : (
              <div>
                <table className="trace-table">
                  <thead>
                    <tr>
                      <th>Chỉ số theo dõi (Mục 7 &amp; 8.5)</th>
                      <th>Kết quả từ các phiếu đã khóa trên máy này</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Lớp ghi nhận trên phiếu</td>
                      <td>{stats.classesText}</td>
                    </tr>
                    <tr>
                      <td>Tổng số phiếu hợp lệ (đã khóa bằng chứng dự đoán)</td>
                      <td>
                        <strong>{stats.totalValid}</strong> phiếu (trên tổng số {items.length} phiếu đang mở)
                      </td>
                    </tr>
                    <tr>
                      <td>Đề Trước tác động: Số dự đoán đúng đầu ra / Tổng phiếu Trước</td>
                      <td>
                        {stats.preTotal > 0 ? `${stats.preOutOk} / ${stats.preTotal} phiếu` : '[Chưa có phiếu Đề Trước]'}
                      </td>
                    </tr>
                    <tr>
                      <td>Đề Sau tác động: Số dự đoán đúng đầu ra / Tổng phiếu Sau</td>
                      <td>
                        {stats.postTotal > 0 ? `${stats.postOutOk} / ${stats.postTotal} phiếu` : '[Chưa có phiếu Đề Sau]'}
                      </td>
                    </tr>
                    <tr>
                      <td>Luyện tập trên lớp: Số dự đoán đúng đầu ra / Tổng phiếu luyện tập</td>
                      <td>
                        {stats.practiceTotal > 0 ? `${stats.practiceOutOk} / ${stats.practiceTotal} phiếu` : '[Chưa có phiếu Luyện tập]'}
                      </td>
                    </tr>
                    <tr>
                      <td>Số phiếu xác định đúng bước đầu tiên có sai lệch (Mục 5 &amp; 8.5)</td>
                      <td>
                        <strong>{stats.allFirstWrongOk} / {stats.totalValid}</strong> phiếu (Trước: {stats.preFirstWrongOk}/{stats.preTotal} · Sau: {stats.postFirstWrongOk}/{stats.postTotal})
                      </td>
                    </tr>
                  </tbody>
                </table>
                {prefs.teacher && (
                  <div className="grid2" style={{ marginTop: '0.8rem' }}>
                    <div className="field">
                      <label htmlFor="sum-err">Ghi nhận lỗi phổ biến của lớp</label>
                      <input
                        id="sum-err"
                        type="text"
                        value={commonErrorsNote}
                        onChange={(e) => setCommonErrorsNote(e.target.value)}
                        placeholder="Ví dụ: Nhầm range(1, 4) lấy cả 4; dùng giá trị cũ trước phép gán..."
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="sum-adj">Điều chỉnh cho bài kế tiếp</label>
                      <input
                        id="sum-adj"
                        type="text"
                        value={nextAdjustNote}
                        onChange={(e) => setNextAdjustNote(e.target.value)}
                        placeholder="Ví dụ: Ôn lại thời điểm đo trước/sau phép gán 5 phút đầu giờ..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card author-card-home" aria-label="Thông tin Tác giả">
        <div className="author-home-inner">
          <img
            src={AUTHOR_INFO.avatarUrl}
            alt={`Giáo viên ${AUTHOR_INFO.name}`}
            className="author-avatar-home"
            width={76}
            height={76}
          />
          <div className="author-home-text">
            <div className="muted">Tác giả xây dựng học liệu số &amp; Biện pháp</div>
            <h2 style={{ margin: '0.15rem 0' }}>Giáo viên: {AUTHOR_INFO.name}</h2>
            <div>
              <strong>{AUTHOR_INFO.school}</strong> · Địa chỉ: {AUTHOR_INFO.address}
            </div>
          </div>
          <div className="author-home-actions">
            <img
              src={AUTHOR_INFO.logoUrl}
              alt={`Biểu trưng ${AUTHOR_INFO.school}`}
              className="author-logo-home"
              width={56}
              height={56}
            />
            <a className="btn small" href="#/author">
              Xem hồ sơ Tác giả &amp; Biện pháp →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
