import { KeyboardEvent, lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { SESSION_PHASES, SessionPhase, StudentStepPrediction, Workspace as W } from '../model';
import { store, useApp } from '../ctx';
import { useWorkspace } from '../useWorkspace';
import { CategoryBadge, SaveStatus, SelectField, TextInput } from '../components/ui';
import { Issue, TabId, validateWorkspace } from '../validate';
import { backupFileName, exportJson } from '../storage';
import { downloadBlob, downloadText } from '../download';
import { slug } from '../text';
import { go } from '../router';
import Predict from './ws/Predict';
import TraceView from './ws/TraceView';
import Reflect from './ws/Reflect';
import ExportTab from './ws/ExportTab';

const Grade = lazy(() => import('./ws/Grade'));
const PrintSheet = lazy(() => import('./PrintSheet'));

const TABS: { id: TabId; label: string; teacherOnly?: boolean }[] = [
  { id: 'predict', label: '1. Điền bảng & Giải thích (Phiếu A)' },
  { id: 'trace', label: '2. Xem từng trạng thái (Mở vết)' },
  { id: 'reflect', label: '3. Sửa bước sai & Vận dụng (Phiếu B)' },
  { id: 'export', label: '4. Xuất phiếu & Nộp bài' },
  { id: 'grade', label: 'Chấm Rubric (10đ)', teacherOnly: true },
];

export default function WorkspacePage({ id, tab, focusStep }: { id: string; tab: TabId; focusStep: string }) {
  const h = useWorkspace(id);
  const { prefs, setPrefs, toast } = useApp();
  const [showCheck, setShowCheck] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { ws, update } = h;

  useEffect(() => {
    if (!focusStep) return;
    const t = window.setTimeout(() => document.getElementById('step-' + focusStep)?.scrollIntoView({ block: 'center' }), 60);
    return () => window.clearTimeout(t);
  }, [focusStep, tab]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const t = window.setTimeout(() => window.print(), 120);
    return () => {
      window.removeEventListener('afterprint', done);
      window.clearTimeout(t);
    };
  }, [printing]);

  const patch = useCallback((p: Partial<W>) => update((w) => ({ ...w, ...p })), [update]);

  const patchStepPred = useCallback(
    (stepId: string, p: Partial<StudentStepPrediction>) =>
      update((w) => ({
        ...w,
        predictions: w.predictions.map((pr) => (pr.stepId === stepId ? { ...pr, ...p } : pr)),
      })),
    [update],
  );

  const patchStepVal = useCallback(
    (stepId: string, colKey: string, val: string) =>
      update((w) => ({
        ...w,
        predictions: w.predictions.map((pr) =>
          pr.stepId === stepId ? { ...pr, values: { ...pr.values, [colKey]: val } } : pr,
        ),
      })),
    [update],
  );

  const patchCorrectedVal = useCallback(
    (stepId: string, colKey: string, val: string) =>
      update((w) => ({
        ...w,
        predictions: w.predictions.map((pr) =>
          pr.stepId === stepId
            ? { ...pr, correctedValues: { ...pr.correctedValues, [colKey]: val } }
            : pr,
        ),
      })),
    [update],
  );

  const lockPrediction = useCallback(() => {
    update((w) => {
      if (w.predictionLocked) return w;
      return { ...w, predictionLocked: true, lockedAt: Date.now() };
    });
    toast('Đã khóa bảng dự đoán ban đầu làm bằng chứng. Hãy lật mở từng trạng thái!');
    go(`/ws/${id}/trace`);
  }, [update, toast, id]);

  const revealNextStep = useCallback(() => {
    update((w) => {
      if (!w.predictionLocked) return w;
      const max = w.challenge.steps.length;
      if (w.revealedCount >= max) return w;
      return { ...w, revealedCount: w.revealedCount + 1 };
    });
  }, [update]);

  const revealOutput = useCallback(() => {
    update((w) => {
      if (!w.predictionLocked || w.revealedCount < w.challenge.steps.length) return w;
      return { ...w, outputRevealed: true };
    });
  }, [update]);

  const setScore = useCallback(
    (idx: number, val: number | null) =>
      update((w) => {
        const scores = [...w.grading.scores];
        scores[idx] = val;
        return { ...w, grading: { ...w.grading, scores } };
      }),
    [update],
  );

  const setNote = useCallback(
    (note: string) => update((w) => ({ ...w, grading: { ...w.grading, note } })),
    [update],
  );

  const issues: Issue[] | null = useMemo(() => (showCheck && ws ? validateWorkspace(ws) : null), [showCheck, ws]);
  const runCheck = useCallback(() => setShowCheck(true), []);

  const onBackup = useCallback(() => {
    if (!ws) return;
    downloadText(exportJson(ws), backupFileName(ws));
  }, [ws]);

  const onDocx = useCallback(async () => {
    if (!ws) return;
    try {
      const { buildDocx } = await import('../exportDocx');
      const blob = await buildDocx(ws);
      downloadBlob(blob, `PhieuTraceChallenge_${slug(ws.studentCode || ws.challenge.title)}.docx`);
    } catch {
      toast('Không tạo được file Word. Hãy thử "In phiếu" hoặc tải file sao lưu (.json).');
    }
  }, [ws, toast]);

  const tabs = useMemo(() => TABS.filter((t) => !t.teacherOnly || prefs.teacher), [prefs.teacher]);

  if (!ws) {
    return (
      <section className="card">
        <h1>Không tìm thấy phiếu bài làm</h1>
        <p>Phiếu này không còn trên máy (có thể đã bị xóa hoặc nằm ở trình duyệt khác). Nếu có file sao lưu (.json), hãy nhập lại ở trang chủ.</p>
        <a className="btn primary" href="#/">
          Về trang chủ
        </a>
      </section>
    );
  }

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex((t) => t.id === tab);
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    window.location.hash = `/ws/${id}/${n.id}`;
    window.setTimeout(() => document.getElementById('tab-' + n.id)?.focus(), 0);
  };

  const effTab: TabId = tab === 'grade' && !prefs.teacher ? 'predict' : tab;

  return (
    <div>
      <div className="no-print">
        <section className="card ws-head">
          <div className="row between wrap">
            <h1 className="ws-title">{ws.challenge.title}</h1>
            <SaveStatus status={h.status} savedAt={h.savedAt} persistent={store.persistent} onRetry={h.retry} />
          </div>
          <div className="row wrap" style={{ marginBottom: '0.4rem' }}>
            <CategoryBadge category={ws.challenge.category} />
            <span className="badge muted">{ws.challenge.lessonRef}</span>
            {ws.predictionLocked ? (
              <span className="badge match-ok">
                🔒 Dự đoán ban đầu đã khóa · Đã mở {ws.revealedCount}/{ws.challenge.steps.length} mốc
              </span>
            ) : (
              <span className="badge locked">Đang ở giai đoạn dự đoán (Chưa mở vết)</span>
            )}
          </div>

          <div className="grid-meta">
            <TextInput
              label="Mã học sinh ẩn danh (Không ghi họ tên đầy đủ)"
              hint="Ví dụ: HS05-10A1 (dùng để đối chiếu Trước–Sau theo Mục 8.5)"
              value={ws.studentCode}
              max={80}
              placeholder="Ví dụ: HS05-10A1"
              onChange={(v) => patch({ studentCode: v })}
            />
            <TextInput
              label="Mã bạn cùng cặp (Trao đổi cặp)"
              hint="Ví dụ: HS06-10A1"
              value={ws.partnerCode}
              max={80}
              placeholder="Ví dụ: HS06-10A1"
              onChange={(v) => patch({ partnerCode: v })}
            />
            <TextInput
              label="Lớp"
              hint="Ví dụ: 10A1 hoặc 11A2"
              value={ws.classLabel}
              max={30}
              placeholder="10A1"
              onChange={(v) => patch({ classLabel: v })}
            />
            <SelectField
              label="Lượt đánh giá"
              hint="Phân loại phiếu Trước / Sau / Luyện tập"
              value={ws.phase}
              onChange={(v) => patch({ phase: (v || 'practice') as SessionPhase })}
              options={Object.entries(SESSION_PHASES)}
            />
          </div>

          {h.status === 'conflict' && (
            <div className="banner bad" role="alert">
              <p>
                <strong>Phiếu này vừa được sửa ở một tab khác của trình duyệt.</strong> Chọn bản nào để giữ?
              </p>
              <div className="row wrap">
                <button className="btn" onClick={h.useTheirs}>
                  Tải bản mới từ tab kia
                </button>
                <button className="btn primary" onClick={h.keepMine}>
                  Ghi đè bằng bản ở tab này
                </button>
                <button className="btn" onClick={onBackup}>
                  Tải bản của tôi về máy trước
                </button>
              </div>
            </div>
          )}

          <div className="row wrap">
            <button type="button" className="btn small" onClick={runCheck} aria-expanded={showCheck}>
              ✓ Kiểm tra điền đủ chưa
            </button>
            <button type="button" className="btn small" onClick={onDocx}>
              📄 Xuất Word (.docx)
            </button>
            <button type="button" className="btn small" onClick={() => setPrinting(true)}>
              🖨 In phiếu
            </button>
            <button type="button" className="btn small" onClick={onBackup}>
              💾 Tải .json
            </button>
          </div>

          {issues && (
            <div className="banner" role="region" aria-label="Kết quả kiểm tra điền đủ chưa" aria-live="polite">
              <div className="row between wrap">
                <strong>
                  {issues.filter((i) => i.level === 'warn').length === 0
                    ? '✓ Tất cả các mục bắt buộc trong phiếu đã được điền đầy đủ!'
                    : `${issues.filter((i) => i.level === 'warn').length} mục cần bổ sung`}
                </strong>
                <button className="btn small ghost" onClick={() => setShowCheck(false)}>
                  Đóng
                </button>
              </div>
              <p className="muted">
                Kiểm tra này chỉ rà soát các trường thông tin đã điền đủ hay chưa, không tiết lộ đáp án khi chưa mở vết.
              </p>
              <ul className="issue-list">
                {issues.map((i) => (
                  <li key={i.key} className={i.level}>
                    {i.level === 'warn' ? '⚠' : 'ℹ'} {i.message}{' '}
                    <a href={`#/ws/${id}/${i.tab}${i.stepId ? '?s=' + i.stepId : ''}`}>Đi tới</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="tabs" role="tablist" aria-label="Các bước thực hiện Trace Challenge" onKeyDown={onTabKey}>
          {tabs.map((t) => (
            <a
              key={t.id}
              id={'tab-' + t.id}
              role="tab"
              aria-selected={effTab === t.id}
              tabIndex={effTab === t.id ? 0 : -1}
              className={'tab' + (effTab === t.id ? ' on' : '')}
              href={`#/ws/${id}/${t.id}`}
            >
              {t.label}
            </a>
          ))}
        </div>

        <div role="tabpanel" aria-labelledby={'tab-' + effTab}>
          {effTab === 'predict' && (
            <Predict
              ws={ws}
              scaffolding={prefs.scaffolding}
              setScaffolding={(v) => setPrefs({ scaffolding: v })}
              patch={patch}
              patchStepPred={patchStepPred}
              patchStepVal={patchStepVal}
              onLockAndTrace={lockPrediction}
            />
          )}
          {effTab === 'trace' && (
            <TraceView
              ws={ws}
              onLockNow={lockPrediction}
              onRevealNextStep={revealNextStep}
              onRevealOutput={revealOutput}
            />
          )}
          {effTab === 'reflect' && (
            <Reflect ws={ws} patch={patch} patchCorrectedVal={patchCorrectedVal} />
          )}
          {effTab === 'export' && (
            <ExportTab
              ws={ws}
              onPrint={() => setPrinting(true)}
              onDocx={onDocx}
              onBackup={onBackup}
              onCheck={runCheck}
            />
          )}
          {effTab === 'grade' && (
            <Suspense fallback={<p>Đang tải bảng chấm Rubric…</p>}>
              <Grade ws={ws} setScore={setScore} setNote={setNote} />
            </Suspense>
          )}
        </div>
      </div>

      {printing && (
        <Suspense fallback={null}>
          <PrintSheet ws={ws} />
        </Suspense>
      )}
    </div>
  );
}
