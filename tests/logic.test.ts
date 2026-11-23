import { describe, expect, it } from 'vitest';
import { AUTHOR_INFO, sha256, stripVN, verifyLogin } from '../src/auth';
import { BUILT_IN_CHALLENGES } from '../src/challenges';
import {
  countCorrectSteps,
  detectActualFirstWrongStepId,
  isOutputCorrect,
  newWorkspace,
  sanWorkspace,
} from '../src/model';
import { suggestAutoScores } from '../src/rubric';
import { MemoryKV, createStore, exportJson, parseImport } from '../src/storage';
import { isValueMatch, normalizeTraceVal } from '../src/text';
import { checkReadyToLockPrediction } from '../src/validate';

describe('Trace Challenge – Kiểm thử nghiệp vụ Biện pháp 02', () => {
  it('1. Kiểm thử vết chuẩn 0–1–3–6 cho bài mẫu Tiết 1 (Mục 3, 8.2, 8.6)', () => {
    const ch = BUILT_IN_CHALLENGES.find((c) => c.id === 'tc-for-sum-14')!;
    expect(ch).toBeDefined();
    expect(ch.steps.map((s) => s.expected.tong_sau)).toEqual(['0', '1', '3', '6']);
    expect(ch.expectedOutput).toBe('6');
    expect(ch.variantExpectedOutput).toBe('10');
  });

  it('2. Không cho phép khóa/mở vết khi học sinh chưa điền đủ dự đoán ban đầu (Mục 4 & 8.6)', () => {
    const ch = BUILT_IN_CHALLENGES[0];
    const ws = newWorkspace(ch, 'pre');
    expect(ws.predictionLocked).toBe(false);
    expect(ws.revealedCount).toBe(0);

    const missingBefore = checkReadyToLockPrediction(ws);
    expect(missingBefore.length).toBeGreaterThan(0);

    // Giả sử dữ liệu JSON cố tình ghi revealedCount = 4 khi chưa khóa dự đoán -> sanWorkspace phải chặn về 0
    const tampered = sanWorkspace({ ...ws, predictionLocked: false, revealedCount: 4, outputRevealed: true })!;
    expect(tampered.revealedCount).toBe(0);
    expect(tampered.outputRevealed).toBe(false);
  });

  it('3. Phát hiện chính xác bước đầu tiên trả lời sai (Mục 2 bước 5 & Mục 8.4)', () => {
    const ch = BUILT_IN_CHALLENGES[0]; // vết chuẩn 0 -> 1 -> 3 -> 6
    const ws = newWorkspace(ch);

    // Mốc 0 đúng (i=-, tong_truoc=-, tong_sau=0)
    ws.predictions[0].values = { i: '-', tong_truoc: '-', tong_sau: '0' };
    // Mốc 1 đúng (i=1, tong_truoc=0, tong_sau=1)
    ws.predictions[1].values = { i: '1', tong_truoc: '0', tong_sau: '1' };
    // Mốc 2 SAI: học sinh quên cộng dồn, lấy 0 + 2 = 2 thay vì 1 + 2 = 3
    ws.predictions[2].values = { i: '2', tong_truoc: '0', tong_sau: '2' };
    // Mốc 3 SAI kéo theo
    ws.predictions[3].values = { i: '3', tong_truoc: '2', tong_sau: '5' };
    ws.predictedOutput = '5';
    ws.orderExplanation = 'Lặp i từ 1 đến 3';

    expect(checkReadyToLockPrediction(ws)).toEqual([]);
    expect(countCorrectSteps(ws)).toBe(2);
    expect(detectActualFirstWrongStepId(ws)).toBe('s2'); // Mốc 2 là bước sai đầu tiên
    expect(isOutputCorrect(ws)).toBe(false);

    ws.firstWrongStepId = 's2';
    const auto = suggestAutoScores(ws);
    expect(auto.stateScore).toBe(2); // 2/4 mốc đúng -> 2 điểm
    expect(auto.outputScore).toBe(0);
    expect(auto.firstWrongMatch).toBe(true);
  });

  it('4. Học sinh dự đoán ban đầu đúng 100%: không bắt buộc tạo lỗi giả (Mục 8.4)', () => {
    const ch = BUILT_IN_CHALLENGES[0];
    const ws = newWorkspace(ch);
    ch.steps.forEach((st, idx) => {
      ws.predictions[idx].values = { ...st.expected };
    });
    ws.predictedOutput = '6';
    ws.orderExplanation = 'range(1, 4) dừng ở 3; mỗi lượt lấy tong cũ cộng i';
    ws.firstWrongStepId = 'none';

    expect(countCorrectSteps(ws)).toBe(4);
    expect(detectActualFirstWrongStepId(ws)).toBe('none');
    expect(isOutputCorrect(ws)).toBe(true);

    const auto = suggestAutoScores(ws);
    expect(auto.stateScore).toBe(4);
    expect(auto.outputScore).toBe(2);
    expect(auto.firstWrongMatch).toBe(true);
  });

  it('5. Chuẩn hóa so khớp mảng và ký hiệu trống cho cả Tin 10 và Tin 11 CS', () => {
    expect(normalizeTraceVal('—')).toBe('-');
    expect(normalizeTraceVal('chưa có')).toBe('-');
    expect(isValueMatch('[10,29,14,37]', '[10, 29, 14, 37]')).toBe(true);
    expect(isValueMatch('10, 29, 14, 37', '[10, 29, 14, 37]')).toBe(true);
    expect(BUILT_IN_CHALLENGES.length).toBe(7);
  });

  it('6. Lưu trữ Store: chống ghi đè bằng rev, tự chữa lành chỉ mục và xuất/nhập JSON', () => {
    const store = createStore(new MemoryKV());
    const ws = newWorkspace(BUILT_IN_CHALLENGES[0], 'pre');
    ws.studentCode = 'HS01-10A1';

    const s1 = store.saveWorkspace(ws, 0);
    expect(s1.ok).toBe(true);
    if (!s1.ok) return;

    // Ghi với baseRev cũ (0 thay vì 1) -> báo conflict
    const conflict = store.saveWorkspace({ ...s1.ws, studentCode: 'HS01-TAB2' }, 0);
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.reason).toBe('conflict');

    // Xuất và nhập lại JSON
    const json = exportJson(s1.ws);
    const parsed = parseImport(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const imp = store.importWorkspace(parsed.workspace);
      expect(imp.ok).toBe(true);
      expect(store.reconcile().length).toBe(2);
    }
  });

  it('7. Cổng đăng nhập SHA-256 và thông tin Tác giả', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(stripVN('  Trần Thị   Kim Thoa ')).toBe('tran thi kim thoa');
    expect(verifyLogin('Trần Thị Kim Thoa', '12345').ok).toBe(true);
    expect(verifyLogin('tran thi kim thoa', '12345').ok).toBe(true);
    expect(verifyLogin('Trần Thị Kim Thoa', 'wrong').ok).toBe(false);
    expect(AUTHOR_INFO.school).toBe('Trường THPT Hoàng Diệu');
  });
});
