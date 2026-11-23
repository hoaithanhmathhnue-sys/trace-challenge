import { useMemo, useState } from 'react';
import { BUILT_IN_CHALLENGES, newCustomChallenge } from '../challenges';
import { Challenge, LIMITS, TOPIC_CATEGORIES, TopicCategory, TraceStepSpec, VarColumnSpec, sanChallenge } from '../model';
import { store, useApp } from '../ctx';
import { SelectField, TextArea, TextInput } from '../components/ui';
import { go } from '../router';
import { uid } from '../text';

export default function ChallengeEditor({ id, from }: { id: string; from: string }) {
  const { toast } = useApp();
  const initial = useMemo<Challenge | null>(() => {
    if (id === 'new') {
      const src = from ? [...BUILT_IN_CHALLENGES, ...store.loadChallenges()].find((c) => c.id === from) : undefined;
      return newCustomChallenge(src);
    }
    return store.loadChallenges().find((c) => c.id === id) ?? null;
  }, [id, from]);

  const [c, setC] = useState<Challenge | null>(initial);
  const [err, setErr] = useState('');

  if (!c) {
    return (
      <section className="card">
        <h1>Không tìm thấy bài tập</h1>
        <a className="btn primary" href="#/challenges">
          Về thư viện bài tập
        </a>
      </section>
    );
  }

  const set = (p: Partial<Challenge>) => setC((x) => (x ? { ...x, ...p } : x));

  const setColumn = (i: number, p: Partial<VarColumnSpec>) =>
    set({ columns: c.columns.map((col, k) => (k === i ? { ...col, ...p } : col)) });

  const addColumn = () => {
    if (c.columns.length >= LIMITS.columns) return;
    const key = `var_${c.columns.length + 1}`;
    const nextCols = [...c.columns, { key, label: `Biến ${c.columns.length + 1}`, hint: '' }];
    const nextSteps = c.steps.map((s) => ({ ...s, expected: { ...s.expected, [key]: '' } }));
    set({ columns: nextCols, steps: nextSteps });
  };

  const removeColumn = (i: number) => {
    if (c.columns.length <= 1) return;
    const removedKey = c.columns[i].key;
    const nextCols = c.columns.filter((_, k) => k !== i);
    const nextSteps = c.steps.map((s) => {
      const exp = { ...s.expected };
      delete exp[removedKey];
      return { ...s, expected: exp };
    });
    set({ columns: nextCols, steps: nextSteps });
  };

  const setStep = (i: number, p: Partial<TraceStepSpec>) =>
    set({ steps: c.steps.map((st, k) => (k === i ? { ...st, ...p } : st)) });

  const setStepExpected = (stepIdx: number, colKey: string, val: string) =>
    set({
      steps: c.steps.map((st, k) =>
        k === stepIdx ? { ...st, expected: { ...st.expected, [colKey]: val } } : st,
      ),
    });

  const addStep = () => {
    if (c.steps.length >= LIMITS.steps) return;
    const expected: Record<string, string> = {};
    c.columns.forEach((col) => {
      expected[col.key] = '';
    });
    set({
      steps: [
        ...c.steps,
        {
          id: `step-${Date.now().toString(36)}-${c.steps.length}`,
          label: `Mốc ${c.steps.length}: Sau lượt ${c.steps.length}`,
          lineNo: 3,
          expected,
          guidingQuestion: 'Lệnh gán này dùng giá trị cũ hay mới của biến?',
          explanation: '',
        },
      ],
    });
  };

  const removeStep = (i: number) => {
    if (c.steps.length <= 1) return;
    set({ steps: c.steps.filter((_, k) => k !== i) });
  };

  const save = () => {
    if (!c.title.trim()) return setErr('Hãy nhập tên bài tập.');
    if (!c.code.trim()) return setErr('Hãy nhập đoạn mã Python (4–8 dòng).');
    if (!c.expectedOutput.trim()) return setErr('Hãy nhập kết quả đầu ra chuẩn của đoạn mã.');
    const clean = sanChallenge({ ...c, id: c.id || uid(), builtIn: false });
    if (!clean) return setErr('Dữ liệu bài tập không hợp lệ.');

    const list = store.loadChallenges();
    const idx = list.findIndex((x) => x.id === clean.id);
    if (idx >= 0) list[idx] = clean;
    else {
      if (list.length >= LIMITS.challenges) return setErr('Đã đạt giới hạn số bài tập tự soạn. Hãy xóa bớt bài cũ.');
      list.push(clean);
    }
    if (!store.saveChallenges(list)) {
      return setErr('Không lưu được bài tập (bộ nhớ trình duyệt đầy hoặc bị chặn).');
    }
    toast('Đã lưu bài tập vào thư viện');
    go('/challenges');
  };

  return (
    <div>
      <section className="card">
        <h1>{id === 'new' ? 'Soạn bài tập dự đoán vết mới' : 'Chỉnh sửa bài tập dự đoán vết'}</h1>
        <p className="muted">
          Theo Mục 2 &amp; Mục 4 của Biện pháp 02: chọn đoạn mã 4–8 dòng chỉ sử dụng lệnh đã học, quy định rõ thời điểm đo (trước hay sau phép gán) và biên soạn câu hỏi gợi ý không tiết lộ đáp án.
        </p>

        <TextInput label="Tên bài tập" value={c.title} max={LIMITS.short} onChange={(v) => set({ title: v })} />
        <div className="grid2">
          <SelectField
            label="Mạch kiến thức / Lớp"
            value={c.category}
            onChange={(v) => set({ category: (v || 'tin10_loop') as TopicCategory })}
            options={Object.entries(TOPIC_CATEGORIES)}
          />
          <TextInput
            label="Bài học SGK tham chiếu"
            value={c.lessonRef}
            max={LIMITS.short}
            onChange={(v) => set({ lessonRef: v })}
          />
        </div>
        <TextInput
          label="Mục tiêu đọc mã của bài"
          value={c.purpose}
          max={LIMITS.mid}
          onChange={(v) => set({ purpose: v })}
        />
        <TextInput
          label="Quy tắc thời điểm đo trên bảng vết (giúp học sinh không nhầm giá trị trước và sau)"
          value={c.measureRule}
          max={LIMITS.mid}
          onChange={(v) => set({ measureRule: v })}
        />
        <TextArea
          label="Đoạn mã Python (khuyến nghị 4–8 dòng)"
          value={c.code}
          rows={6}
          max={LIMITS.code}
          onChange={(v) => set({ code: v })}
        />
      </section>

      <section className="card">
        <div className="row between wrap">
          <h2>1. Các cột biến trong bảng dự đoán ({c.columns.length})</h2>
          <button className="btn small" disabled={c.columns.length >= LIMITS.columns} onClick={addColumn}>
            + Thêm cột biến
          </button>
        </div>
        <p className="muted">
          Nhóm học sinh cần hỗ trợ sẽ nhìn thấy gợi ý cột biến (ví dụ: <code>i</code>, <code>tong trước</code>, <code>tong sau</code>).
        </p>
        {c.columns.map((col, i) => (
          <fieldset key={col.key} className="step-fieldset">
            <legend>Cột {i + 1}</legend>
            <div className="grid2">
              <TextInput
                label="Tên cột hiển thị (ví dụ: i, tong trước, tong sau)"
                value={col.label}
                max={60}
                onChange={(v) => setColumn(i, { label: v })}
              />
              <TextInput
                label="Gợi ý ngắn cho học sinh cần hỗ trợ"
                value={col.hint}
                max={LIMITS.short}
                onChange={(v) => setColumn(i, { hint: v })}
              />
            </div>
            {c.columns.length > 1 && (
              <button className="btn small danger" onClick={() => removeColumn(i)}>
                Xóa cột {col.label}
              </button>
            )}
          </fieldset>
        ))}
      </section>

      <section className="card">
        <div className="row between wrap">
          <h2>2. Các mốc điểm dừng và bảng vết chuẩn ({c.steps.length} mốc)</h2>
          <button className="btn small primary" disabled={c.steps.length >= LIMITS.steps} onClick={addStep}>
            + Thêm mốc điểm dừng
          </button>
        </div>
        <p className="muted">
          Khai báo giá trị đúng cho từng mốc. Câu hỏi gợi ý sẽ hiển thị khi học sinh cần định hướng (ví dụ: "Lệnh gán này dùng giá trị cũ hay mới?"), còn lời giải thích chỉ hiện SAU khi học sinh đã mở bước đó.
        </p>
        {c.steps.map((st, idx) => (
          <fieldset key={st.id} className="step-fieldset">
            <legend>Mốc {idx}</legend>
            <div className="grid2">
              <TextInput
                label="Tên mốc / thời điểm dừng"
                value={st.label}
                max={LIMITS.short}
                onChange={(v) => setStep(idx, { label: v })}
              />
              <TextInput
                label="Số thứ tự dòng lệnh đang xét (1, 2, 3...)"
                type="number"
                value={String(st.lineNo)}
                onChange={(v) => setStep(idx, { lineNo: Math.max(1, Number(v) || 1) })}
              />
            </div>
            <div className="grid-vars">
              {c.columns.map((col) => (
                <TextInput
                  key={col.key}
                  label={`Giá trị chuẩn: ${col.label}`}
                  hint="Ghi - nếu biến chưa có giá trị"
                  value={st.expected[col.key] ?? ''}
                  max={LIMITS.short}
                  onChange={(v) => setStepExpected(idx, col.key, v)}
                />
              ))}
            </div>
            <TextInput
              label="Câu hỏi gợi ý định hướng (KHÔNG tiết lộ đáp án)"
              value={st.guidingQuestion}
              max={LIMITS.mid}
              onChange={(v) => setStep(idx, { guidingQuestion: v })}
            />
            <TextArea
              label="Giải thích quy tắc thực hiện lệnh (chỉ hiện SAU khi mở bước này)"
              value={st.explanation}
              rows={2}
              max={LIMITS.mid}
              onChange={(v) => setStep(idx, { explanation: v })}
            />
            {c.steps.length > 1 && (
              <button className="btn small danger" onClick={() => removeStep(idx)}>
                Xóa mốc này
              </button>
            )}
          </fieldset>
        ))}
      </section>

      <section className="card">
        <h2>3. Kết quả đầu ra chuẩn và câu hỏi Vận dụng (Thay đổi đầu vào)</h2>
        <div className="grid2">
          <TextInput
            label="Kết quả đầu ra chuẩn của đoạn mã (print)"
            value={c.expectedOutput}
            max={LIMITS.short}
            onChange={(v) => set({ expectedOutput: v })}
          />
          <TextInput
            label="Câu hỏi gợi ý cho đầu ra (không lộ đáp án)"
            value={c.outputGuidingQuestion}
            max={LIMITS.mid}
            onChange={(v) => set({ outputGuidingQuestion: v })}
          />
        </div>
        <TextArea
          label="Giải thích kết quả đầu ra (hiện sau khi học sinh mở đầu ra)"
          value={c.outputExplanation}
          rows={2}
          max={LIMITS.mid}
          onChange={(v) => set({ outputExplanation: v })}
        />

        <hr className="sep" />
        <h3>Bước 6: Bài tập Vận dụng (Thay đổi một giá trị đầu vào / điều kiện)</h3>
        <TextInput
          label="Đề bài vận dụng (ví dụ: Thay range(1, 4) bằng range(1, 5)...)"
          value={c.variantPrompt}
          max={LIMITS.mid}
          onChange={(v) => set({ variantPrompt: v })}
        />
        <TextArea
          label="Đoạn mã sau khi thay đổi đầu vào"
          value={c.variantCode}
          rows={4}
          max={LIMITS.code}
          onChange={(v) => set({ variantCode: v })}
        />
        <div className="grid2">
          <TextInput
            label="Dãy giá trị trạng thái chuẩn ở bước vận dụng (ví dụ: 1, 3, 6, 10)"
            value={c.variantExpectedTrace}
            max={LIMITS.short}
            onChange={(v) => set({ variantExpectedTrace: v })}
          />
          <TextInput
            label="Đầu ra chuẩn ở bước vận dụng (ví dụ: 10)"
            value={c.variantExpectedOutput}
            max={LIMITS.short}
            onChange={(v) => set({ variantExpectedOutput: v })}
          />
        </div>
        <TextArea
          label="Giải thích đáp án vận dụng"
          value={c.variantExplanation}
          rows={2}
          max={LIMITS.mid}
          onChange={(v) => set({ variantExplanation: v })}
        />
        <TextArea
          label="Ghi chú sư phạm cho giáo viên (lỗi phổ biến, gợi ý tổ chức lớp)"
          value={c.teacherNotes}
          rows={2}
          max={LIMITS.long}
          onChange={(v) => set({ teacherNotes: v })}
        />
      </section>

      {err && (
        <p className="banner bad" role="alert">
          {err}
        </p>
      )}
      <div className="row wrap">
        <button className="btn primary big" onClick={save}>
          Lưu bài tập
        </button>
        <a className="btn big" href="#/challenges">
          Hủy
        </a>
      </div>
    </div>
  );
}
