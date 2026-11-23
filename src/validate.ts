import { Workspace, isStepFilled } from './model';
import { detectPersonalData } from './text';

export type TabId = 'predict' | 'trace' | 'reflect' | 'export' | 'grade';

export interface Issue {
  key: string;
  level: 'warn' | 'info';
  message: string;
  tab: TabId;
  stepId?: string;
}

/**
 * Kiểm tra xem học sinh đã điền đủ các mục bắt buộc ở Bước 1 (Phiếu A) để được phép
 * khóa dự đoán và mở xem từng trạng thái ở Bước 2 hay chưa.
 * Đúng yêu cầu Mục 2, 4 và 8.6: "Học sinh nhập dự đoán trước khi bấm hiện bước tương ứng.
 * Không hiện đáp án trước thao tác mở."
 */
export function checkReadyToLockPrediction(ws: Workspace): string[] {
  const missing: string[] = [];
  ws.challenge.steps.forEach((st, idx) => {
    const pred = ws.predictions[idx];
    if (!isStepFilled(pred, ws.challenge.columns)) {
      missing.push(`Chưa điền đủ các ô biến ở "${st.label}".`);
    }
  });
  if (!ws.predictedOutput.trim()) {
    missing.push('Chưa nhập dự đoán kết quả đầu ra cuối cùng.');
  }
  if (!ws.orderExplanation.trim()) {
    missing.push('Chưa viết giải thích quy tắc/thứ tự thực hiện lệnh ở Phiếu A.');
  }
  return missing;
}

/**
 * Nút "Kiểm tra điền đủ chưa": kiểm tra tính đầy đủ của toàn bộ phiếu học tập (Phiếu A + Mở vết + Phiếu B).
 * Không tiết lộ đáp án đúng/sai khi học sinh chưa mở vết!
 */
export function validateWorkspace(ws: Workspace): Issue[] {
  const out: Issue[] = [];

  if (!ws.studentCode.trim()) {
    out.push({
      key: 'student-code',
      level: 'warn',
      message: 'Chưa ghi mã học sinh ẩn danh (ví dụ HS05-10A1).',
      tab: 'predict',
    });
  }

  const pii = detectPersonalData([ws.studentCode, ws.partnerCode, ws.orderExplanation, ws.wrongCauseExplanation].join(' '));
  if (pii.length > 0) {
    out.push({
      key: 'pii',
      level: 'warn',
      message: `Phát hiện thông tin giống ${pii.join(', ')}. Chỉ dùng mã ẩn danh, không ghi thông tin cá nhân nhạy cảm.`,
      tab: 'predict',
    });
  }

  ws.challenge.steps.forEach((st, idx) => {
    const pred = ws.predictions[idx];
    if (!isStepFilled(pred, ws.challenge.columns)) {
      out.push({
        key: 'step-val-' + st.id,
        level: 'warn',
        message: `${st.label}: còn ô giá trị biến chưa điền dự đoán.`,
        tab: 'predict',
        stepId: st.id,
      });
    }
    if (!pred?.reason.trim()) {
      out.push({
        key: 'step-reason-' + st.id,
        level: 'info',
        message: `${st.label}: nên ghi ngắn gọn lí do cho giá trị dự đoán.`,
        tab: 'predict',
        stepId: st.id,
      });
    }
  });

  if (!ws.predictedOutput.trim()) {
    out.push({
      key: 'pred-out',
      level: 'warn',
      message: 'Phiếu A: chưa điền dự đoán đầu ra cuối cùng.',
      tab: 'predict',
    });
  }

  if (!ws.orderExplanation.trim()) {
    out.push({
      key: 'order-exp',
      level: 'warn',
      message: 'Phiếu A: chưa giải thích quy tắc thực hiện lệnh / cận dừng.',
      tab: 'predict',
    });
  }

  if (!ws.predictionLocked) {
    out.push({
      key: 'not-locked',
      level: 'warn',
      message: 'Chưa bấm "Khóa dự đoán để mở vết" ở cuối màn hình 1.',
      tab: 'predict',
    });
  } else {
    if (ws.revealedCount < ws.challenge.steps.length || !ws.outputRevealed) {
      out.push({
        key: 'not-revealed-all',
        level: 'warn',
        message: `Màn hình 2: mới mở ${ws.revealedCount}/${ws.challenge.steps.length} mốc trạng thái${ws.outputRevealed ? '' : ' và chưa mở đầu ra chuẩn'}.`,
        tab: 'trace',
      });
    }
  }

  if (!ws.firstWrongStepId) {
    out.push({
      key: 'first-wrong',
      level: 'warn',
      message: 'Phiếu B: chưa đánh dấu bước đầu tiên dự đoán sai (hoặc xác nhận không có bước sai).',
      tab: 'reflect',
    });
  }

  if (!ws.wrongCauseExplanation.trim()) {
    out.push({
      key: 'wrong-cause',
      level: 'warn',
      message: 'Phiếu B: chưa viết câu giải thích nguyên nhân sai lệch (hoặc lí giải vì sao vết đúng hoàn toàn).',
      tab: 'reflect',
    });
  }

  if (ws.challenge.variantPrompt && !ws.variantPredictedOutput.trim()) {
    out.push({
      key: 'variant-out',
      level: 'warn',
      message: 'Phần Vận dụng: chưa nhập dự đoán đầu ra mới khi thay đổi dữ liệu đầu vào.',
      tab: 'reflect',
    });
  }

  return out;
}
