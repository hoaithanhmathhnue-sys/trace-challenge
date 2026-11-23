// Nạp muộn (dynamic import): xuất phiếu học tập cá nhân/cặp và mẫu tổng hợp sau dạy ra file Word (.docx).
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  SESSION_PHASES,
  TOPIC_CATEGORIES,
  Workspace,
  countCorrectSteps,
  detectActualFirstWrongStepId,
  isOutputCorrect,
  isStepCorrect,
} from './model';
import { TRACE_RUBRIC, sumScores } from './rubric';
import { cleanXml, formatDateTime, isValueMatch } from './text';

const FONT = 'Times New Roman';
const SZ = 26; // 13pt
const SZ_TABLE = 22; // 11pt

function runs(text: string, opt: { bold?: boolean; italics?: boolean; size?: number } = {}): TextRun[] {
  const lines = cleanXml(text).split(/\r?\n/);
  return lines.map(
    (l, i) =>
      new TextRun({
        text: l,
        break: i > 0 ? 1 : 0,
        font: FONT,
        size: opt.size ?? SZ,
        bold: opt.bold,
        italics: opt.italics,
      }),
  );
}

const para = (text: string, opt: { bold?: boolean; italics?: boolean; size?: number; after?: number } = {}) =>
  new Paragraph({ children: runs(text, opt), spacing: { after: opt.after ?? 120 } });

const heading = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: cleanXml(text), font: FONT, size: 28, bold: true })],
  });

function cell(text: string, w: number, bold = false): TableCell {
  return new TableCell({
    width: { size: w, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [new Paragraph({ children: runs(text || '', { bold, size: SZ_TABLE }) })],
  });
}

function table(head: string[], widths: number[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, widths[i], true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: false, children: r.map((t, i) => cell(t, widths[i])) })),
    ],
  });
}

export async function buildDocx(ws: Workspace): Promise<Blob> {
  const kids: (Paragraph | Table)[] = [];
  const ch = ws.challenge;

  kids.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: 'PHIẾU HỌC TẬP TRACE CHALLENGE – DỰ ĐOÁN ĐƯỜNG ĐI CỦA THUẬT TOÁN',
          bold: true,
          font: FONT,
          size: 30,
        }),
      ],
    }),
  );

  kids.push(
    para(
      `Mã học sinh (ẩn danh): ${ws.studentCode || '(chưa ghi)'}    Bạn cùng cặp: ${ws.partnerCode || '…'}    Lớp: ${ws.classLabel || '…'}    Loại phiếu: ${SESSION_PHASES[ws.phase]}`,
    ),
  );
  kids.push(para(`Bài tập: ${ch.title} (${TOPIC_CATEGORIES[ch.category]} – ${ch.lessonRef})`, { bold: true, after: 60 }));
  kids.push(para(`Mục đích: ${ch.purpose}`, { italics: true, after: 60 }));
  kids.push(para(`Quy tắc thời điểm đo: ${ch.measureRule}`, { italics: true }));

  kids.push(heading('1. Đoạn mã Python cần theo dõi'));
  kids.push(para(ch.code));

  kids.push(heading('2. Phiếu A – Bảng dự đoán trạng thái biến trước khi chạy (Bằng chứng gốc)'));
  kids.push(
    para(
      ws.predictionLocked
        ? `Trạng thái bằng chứng: Đã khóa dự đoán ban đầu lúc ${formatDateTime(ws.lockedAt)}. Đã mở ${ws.revealedCount}/${ch.steps.length} mốc vết.`
        : 'Trạng thái bằng chứng: Chưa khóa dự đoán (chưa mở vết).',
      { italics: true },
    ),
  );

  // Xây dựng bảng dự đoán & đối chiếu
  const colCount = ch.columns.length;
  const stepHead = [
    'Mốc / Thời điểm',
    ...ch.columns.map((c) => `Dự đoán: ${c.label}`),
    'Lí do dự đoán & Trao đổi cặp',
    'Kết quả mở vết & Đối chiếu',
  ];
  const varWidth = Math.max(8, Math.floor(36 / Math.max(1, colCount)));
  const remain = 100 - 18 - varWidth * colCount;
  const reasonW = Math.floor(remain / 2);
  const checkW = remain - reasonW;
  const widths = [18, ...ch.columns.map(() => varWidth), reasonW, checkW];

  const actualFirstWrong = detectActualFirstWrongStepId(ws);

  const stepRows = ch.steps.map((st, idx) => {
    const pred = ws.predictions[idx];
    const isRevealed = ws.predictionLocked && idx < ws.revealedCount;
    const stepOk = isStepCorrect(st, pred, ch.columns);
    const predCols = ch.columns.map((c) => pred?.values[c.key] || '(trống)');
    const pairText = pred?.pairDiff ? ` [Khác bạn cùng cặp: ${pred.pairNote || 'có khác biệt'}]` : '';
    const reasonText = (pred?.reason || '') + pairText;
    let checkText = 'Chưa mở bước này';
    if (isRevealed) {
      const expStr = ch.columns.map((c) => `${c.label}=${st.expected[c.key]}`).join(', ');
      const statusStr = stepOk
        ? '✓ Khớp hoàn toàn'
        : st.id === actualFirstWrong
          ? '✗ Lệch (Bước sai đầu tiên)'
          : '✗ Lệch';
      checkText = `${statusStr}. Vết chuẩn: ${expStr}`;
    }
    return [st.label, ...predCols, reasonText, checkText];
  });

  kids.push(table(stepHead, widths, stepRows));

  const trickyLabel = ch.steps.find((s) => s.id === ws.trickyStepId)?.label || ws.trickyStepId || '(chưa chọn)';
  kids.push(
    para(
      `Dự đoán đầu ra ban đầu: ${ws.predictedOutput || '(chưa điền)'}` +
        (ws.outputRevealed
          ? `  |  Đầu ra thực tế: ${ch.expectedOutput} (${isOutputCorrect(ws) ? '✓ Đúng' : '✗ Sai'})`
          : '  |  (Chưa mở đầu ra thực tế)'),
      { bold: true },
    ),
  );
  kids.push(para(`Bước dễ nhầm đã đánh dấu: ${trickyLabel}`));
  kids.push(para(`Giải thích thứ tự và quy tắc thực hiện lệnh: ${ws.orderExplanation || '(chưa viết)'}`));

  kids.push(heading('3. Phiếu B – Phát hiện bước sai đầu tiên và tự sửa cách hiểu'));
  const studentPickedWrong =
    ws.firstWrongStepId === 'none'
      ? 'Không có bước sai (dự đoán ban đầu khớp toàn bộ)'
      : ch.steps.find((s) => s.id === ws.firstWrongStepId)?.label || '(chưa xác định)';
  kids.push(para(`Bước sai đầu tiên học sinh xác định: ${studentPickedWrong}`, { bold: true }));
  kids.push(para(`Nguyên nhân sai lệch / Giải thích kiểm chứng vết: ${ws.wrongCauseExplanation || '(chưa viết)'}`));

  // Nếu học sinh có nhập giá trị sửa lại ở các bước
  const hasCorrections = ws.predictions.some((p) =>
    ch.columns.some((c) => (p.correctedValues[c.key] ?? '').trim().length > 0),
  );
  if (hasCorrections) {
    const corrHead = ['Mốc / Thời điểm', ...ch.columns.map((c) => `Dự đoán ban đầu (${c.label})`), ...ch.columns.map((c) => `Đã sửa lại (${c.label})`)];
    const cw = Math.floor(80 / (colCount * 2));
    const corrWidths = [100 - cw * colCount * 2, ...ch.columns.map(() => cw), ...ch.columns.map(() => cw)];
    const corrRows = ch.steps.map((st, idx) => {
      const p = ws.predictions[idx];
      return [
        st.label,
        ...ch.columns.map((c) => p?.values[c.key] || '-'),
        ...ch.columns.map((c) => p?.correctedValues[c.key] || p?.values[c.key] || '-'),
      ];
    });
    kids.push(table(corrHead, corrWidths, corrRows));
  }

  kids.push(heading('4. Vận dụng – Dự đoán khi thay đổi dữ liệu đầu vào / điều kiện'));
  kids.push(para(`Yêu cầu vận dụng: ${ch.variantPrompt}`));
  kids.push(
    para(
      `Dự đoán vết mới: ${ws.variantPredictedTrace || '(chưa điền)'}   |   Dự đoán đầu ra mới: ${ws.variantPredictedOutput || '(chưa điền)'}` +
        (ws.variantRevealed
          ? `   |   Đáp án đầu ra vận dụng: ${ch.variantExpectedOutput} (${isValueMatch(ws.variantPredictedOutput, ch.variantExpectedOutput) ? '✓ Đúng' : '✗ Sai'})`
          : ''),
    ),
  );
  kids.push(para(`Giải thích vận dụng: ${ws.variantExplanation || '(chưa viết)'}`));

  const hasGrades = ws.grading.scores.some((s) => s !== null) || ws.grading.note.trim().length > 0;
  if (hasGrades) {
    kids.push(heading('5. Đánh giá theo Rubric 10 điểm (Giáo viên)'));
    const rubricRows = TRACE_RUBRIC.map((r, i) => [
      r.name,
      `${ws.grading.scores[i] ?? '…'} / ${r.max}`,
    ]);
    kids.push(table(['Tiêu chí', 'Điểm'], [75, 25], rubricRows));
    kids.push(para(`Tổng điểm: ${sumScores(ws.grading.scores)} / 10`, { bold: true }));
    if (ws.grading.note) kids.push(para(`Nhận xét của giáo viên: ${ws.grading.note}`));
  }

  kids.push(
    para(
      `Tổng kết tự động trên bảng vết: Đúng ${countCorrectSteps(ws)}/${ch.steps.length} mốc trạng thái. Giáo viên: Trần Thị Kim Thoa – Trường THPT Hoàng Diệu (Số 1 Mạc Đĩnh Chi, phường Phú Lợi, thành phố Cần Thơ).`,
      { italics: true, size: 20 },
    ),
  );

  const doc = new Document({
    creator: 'Trần Thị Kim Thoa - Trace Challenge',
    title: cleanXml(`Phiếu Trace Challenge – ${ws.studentCode || ch.title}`),
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 850, bottom: 850, left: 850, right: 850 },
          },
        },
        children: kids,
      },
    ],
  });
  return Packer.toBlob(doc);
}
