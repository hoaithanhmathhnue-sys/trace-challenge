// Rubric 10 điểm theo đúng Mục 5 và Mục 8.4 của Biện pháp 02 – Trace Challenge.

import { Workspace, countCorrectSteps, detectActualFirstWrongStepId, isOutputCorrect } from './model';

export interface Criterion {
  id: string;
  name: string;
  max: number;
  levels: string[];
}

export const TRACE_RUBRIC: Criterion[] = [
  {
    id: 'states',
    name: '1. Điền trạng thái biến tại các điểm dừng',
    max: 4,
    levels: [
      '4 điểm: Điền đúng tất cả các mốc trạng thái giáo viên công bố (4/4 mốc hoặc 100% số mốc).',
      '3 điểm: Điền đúng 3/4 số mốc trạng thái.',
      '2 điểm: Điền đúng 2/4 số mốc trạng thái.',
      '1 điểm: Điền đúng 1 mốc trạng thái (ví dụ mốc khởi tạo trước vòng lặp).',
      '0 điểm: Chưa điền hoặc sai toàn bộ các mốc trạng thái.',
    ],
  },
  {
    id: 'output',
    name: '2. Dự đoán đầu ra cuối cùng',
    max: 2,
    levels: [
      '2 điểm: Dự đoán chính xác giá trị đầu ra cuối cùng của đoạn mã (không nhầm với dãy giá trị trung gian).',
      '1 điểm: Tính đúng đến lượt cuối nhưng ghi nhầm thành dãy giá trị trung gian hoặc sai quy cách nhỏ.',
      '0 điểm: Dự đoán sai đầu ra hoặc bỏ trống.',
    ],
  },
  {
    id: 'explanation',
    name: '3. Giải thích đúng thứ tự và quy tắc thực hiện lệnh',
    max: 2,
    levels: [
      '2 điểm: Giải thích rõ quy tắc thực hiện lệnh (ví dụ: vì sao range dừng trước cận trên; phép gán dùng giá trị cũ của biến cộng với i hiện tại).',
      '1 điểm: Có nêu được quy tắc nhưng diễn đạt còn thiếu một trong hai ý (cận dừng hoặc giá trị trước/sau phép gán).',
      '0 điểm: Không giải thích hoặc giải thích sai bản chất lệnh.',
    ],
  },
  {
    id: 'reflection',
    name: '4. Phát hiện và sửa bước sai đầu tiên (hoặc kiểm chứng vết đúng)',
    max: 2,
    levels: [
      '2 điểm: Xác định đúng bước đầu tiên có sai lệch, sửa lại bảng và viết đúng nguyên nhân. (Lưu ý Mục 8.4: Nếu dự đoán ban đầu hoàn toàn đúng, vẫn cho đủ 2 điểm khi học sinh kiểm tra được vết và giải thích vì sao không có bước sai, không bắt buộc tạo lỗi giả).',
      '1 điểm: Chỉ ra được bước sai đầu tiên nhưng chưa sửa đúng bảng hoặc chưa giải thích rõ nguyên nhân.',
      '0 điểm: Không xác định được bước sai đầu tiên hoặc bỏ trống phần đối chiếu.',
    ],
  },
];

export const RUBRIC_NOTE =
  'Rubric 10 điểm (Mục 5 & 8.4): Chia điểm trạng thái theo từng mốc thay vì chấm tất cả hoặc không có gì. Nếu học sinh dự đoán ban đầu hoàn toàn đúng, cho điểm tiêu chí 4 khi em kiểm tra được vết và giải thích vì sao không có bước sai, không bắt buộc tạo lỗi giả.';

export const sumScores = (xs: (number | null)[]): number =>
  xs.reduce<number>((a, b) => a + (b ?? 0), 0);

export const isFullyGraded = (xs: (number | null)[]): boolean =>
  xs.every((x) => x !== null);

/**
 * Gợi ý điểm khách quan cho tiêu chí 1 (Trạng thái biến - 4đ) và tiêu chí 2 (Đầu ra - 2đ)
 * dựa trên dữ liệu đối chiếu tự động. Giáo viên có toàn quyền quyết định/điều chỉnh.
 */
export function suggestAutoScores(ws: Workspace): { stateScore: number; outputScore: number; firstWrongMatch: boolean } {
  const totalSteps = ws.challenge.steps.length || 1;
  const correctSteps = countCorrectSteps(ws);
  // Quy đổi tỷ lệ số mốc đúng sang thang 4 điểm (làm tròn đến 0.5)
  const rawState = (correctSteps / totalSteps) * 4;
  const stateScore = Math.round(rawState * 2) / 2;
  const outputScore = isOutputCorrect(ws) ? 2 : 0;
  const actualFirstWrong = detectActualFirstWrongStepId(ws);
  const firstWrongMatch = ws.firstWrongStepId !== '' && ws.firstWrongStepId === actualFirstWrong;
  return { stateScore, outputScore, firstWrongMatch };
}
