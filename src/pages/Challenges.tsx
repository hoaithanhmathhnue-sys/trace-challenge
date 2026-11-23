import { useEffect, useMemo, useState } from 'react';
import { BUILT_IN_CHALLENGES } from '../challenges';
import { Challenge, SESSION_PHASES, SessionPhase, TOPIC_CATEGORIES, newWorkspace } from '../model';
import { store, useApp } from '../ctx';
import { CategoryBadge, CodeBlock } from '../components/ui';
import { go } from '../router';
import { allowDelete } from '../guard';

export default function Challenges() {
  const { prefs, toast } = useApp();
  const [mine, setMine] = useState<Challenge[]>([]);
  const [catFilter, setCatFilter] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<SessionPhase>('practice');

  useEffect(() => setMine(store.loadChallenges()), []);

  const startChallenge = (ch: Challenge, phase: SessionPhase = selectedPhase) => {
    const ws = newWorkspace(ch, phase);
    const r = store.saveWorkspace(ws, 0, true);
    if (!r.ok) return toast('Không lưu được phiếu mới (bộ nhớ trình duyệt đầy hoặc bị chặn).');
    go(`/ws/${ws.id}/predict`);
  };

  const remove = (ch: Challenge) => {
    if (!allowDelete()) return;
    const before = store.loadChallenges();
    store.saveChallenges(before.filter((x) => x.id !== ch.id));
    setMine(store.loadChallenges());
    toast(`Đã xóa bài tập "${ch.title}"`, () => {
      store.saveChallenges(before);
      setMine(store.loadChallenges());
    });
  };

  const all = useMemo(() => [...BUILT_IN_CHALLENGES, ...mine], [mine]);
  const filtered = useMemo(
    () => (catFilter === 'all' ? all : all.filter((c) => c.category === catFilter)),
    [all, catFilter],
  );

  return (
    <div>
      <section className="card">
        <div className="row between wrap">
          <div>
            <h1>Màn hình 1: Chọn bài tập dự đoán vết (Thư viện mã)</h1>
            <p className="muted">
              Mỗi bài gồm một đoạn mã 4–8 dòng chỉ dùng lệnh đã học, quy tắc thời điểm đo và các mốc điểm dừng.{' '}
              <strong>Đáp án vết chuẩn luôn được ẩn</strong> cho tới khi học sinh điền và khóa bảng dự đoán.
            </p>
          </div>
          <a className="btn primary" href="#/challenges/edit/new">
            + Soạn bài tập mới (Giáo viên)
          </a>
        </div>

        <div className="grid2" style={{ marginTop: '0.6rem' }}>
          <div className="field">
            <label htmlFor="cat-filter">Lọc theo mạch kiến thức (Tin 10 &amp; Tin 11 CS)</label>
            <select id="cat-filter" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">Tất cả chủ đề ({all.length} bài)</option>
              {Object.entries(TOPIC_CATEGORIES).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="phase-select">Loại phiếu khi bắt đầu làm bài</label>
            <select
              id="phase-select"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as SessionPhase)}
            >
              {Object.entries(SESSION_PHASES).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {filtered.map((ch) => (
        <section key={ch.id} className="card" aria-label={ch.title}>
          <div className="row between wrap">
            <h2>{ch.title}</h2>
            <div className="row wrap">
              <CategoryBadge category={ch.category} />
              <span className="badge muted">{ch.lessonRef}</span>
            </div>
          </div>

          <p>
            <strong>Mục tiêu đọc mã:</strong> {ch.purpose}
          </p>
          <p className="muted">
            <strong>Thời điểm đo trên bảng vết:</strong> {ch.measureRule}
          </p>

          <CodeBlock code={ch.code} caption={`${ch.steps.length} mốc điểm dừng · Cột biến: ${ch.columns.map((c) => c.label).join(', ')}`} />

          {prefs.teacher && (
            <aside className="teacher-hint">
              <div>
                <strong>Ghi chú cho giáo viên (Chế độ giáo viên):</strong> {ch.teacherNotes || 'Không có ghi chú thêm.'}
              </div>
              <div style={{ marginTop: '0.35rem' }}>
                <strong>Bảng vết chuẩn:</strong>{' '}
                {ch.steps
                  .map(
                    (s) =>
                      `${s.label}: (${ch.columns.map((c) => `${c.label}=${s.expected[c.key]}`).join(', ')})`,
                  )
                  .join(' → ')}{' '}
                | <strong>Đầu ra chuẩn:</strong> <code>{ch.expectedOutput}</code> | <strong>Đầu ra vận dụng:</strong>{' '}
                <code>{ch.variantExpectedOutput}</code>
              </div>
            </aside>
          )}

          <div className="row wrap" style={{ marginTop: '0.75rem' }}>
            <button className="btn primary" onClick={() => startChallenge(ch)}>
              ▶ Chọn bài này &amp; Điền bảng dự đoán
            </button>
            <a className="btn" href={`#/challenges/print/${ch.id}`}>
              In phiếu &amp; Thẻ vết úp–lật
            </a>
            <a className="btn" href={`#/challenges/edit/new?from=${encodeURIComponent(ch.id)}`}>
              Sao chép &amp; Sửa
            </a>
            {!ch.builtIn && (
              <>
                <a className="btn" href={`#/challenges/edit/${ch.id}`}>
                  Sửa
                </a>
                <button className="btn danger" onClick={() => remove(ch)}>
                  Xóa
                </button>
              </>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
