// Các hàm xử lý chuỗi, chuẩn hóa giá trị dự đoán biến và làm sạch dữ liệu (thuần TS, kiểm thử độc lập).

export const nfc = (s: string): string => s.normalize('NFC');

/** Cắt chuỗi an toàn theo độ dài tối đa, không cắt đôi cặp surrogate (emoji). */
export function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  let s = v;
  if (s.length > max) {
    s = s.slice(0, max);
    const last = s.charCodeAt(s.length - 1);
    if (last >= 0xd800 && last <= 0xdbff) s = s.slice(0, -1);
  }
  return s;
}

/** Bỏ ký tự điều khiển XML không hợp lệ khi xuất file Word (.docx). */
export function cleanXml(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '$1');
}

export function uid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'tc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Chuẩn hóa giá trị biến hoặc đầu ra để so khớp công bằng:
 * - Bỏ khoảng trắng thừa đầu/cuối
 * - Chuẩn hóa khoảng trắng quanh dấu phẩy trong mảng/danh sách: "[10, 29, 14]" === "[10,29,14]"
 * - Chuẩn hóa ký hiệu trống / chưa khởi tạo: "-", "—", "chưa có", "none" -> "-"
 */
export function normalizeTraceVal(raw: string): string {
  const s = nfc(raw ?? '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower === '-' || lower === '—' || lower === '–' || lower === 'chưa có' || lower === 'chua co' || lower === 'none') {
    return '-';
  }
  // Chuẩn hóa khoảng trắng quanh dấu phẩy và ngoặc vuông
  return s
    .replace(/\s*\[\s*/g, '[')
    .replace(/\s*\]\s*/g, ']')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ');
}

/**
 * So khớp giá trị học sinh dự đoán với giá trị chuẩn trong bảng vết.
 * Trả về true nếu khớp sau khi chuẩn hóa.
 */
export function isValueMatch(predicted: string, expected: string): boolean {
  const p = normalizeTraceVal(predicted);
  const e = normalizeTraceVal(expected);
  if (!p) return false;
  if (p === e) return true;
  // Cho phép trường hợp mảng số viết không có ngoặc vuông: "10, 29, 14, 37" so với "[10, 29, 14, 37]"
  if (e.startsWith('[') && e.endsWith(']') && `[${p}]` === e) return true;
  // Cho phép so sánh số thực/số nguyên tương đương (ví dụ "+6" và "6")
  if (/^[+-]?\d+$/.test(p) && /^[+-]?\d+$/.test(e)) {
    return Number(p) === Number(e);
  }
  return false;
}

/** Phát hiện thông tin cá nhân nhạy cảm (chỉ cảnh báo, không chặn). */
export function detectPersonalData(text: string): string[] {
  const found: string[] = [];
  if (/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+/u.test(text)) found.push('địa chỉ email');
  if (/(?<!\d)(?:\+?84|0)(?:[\s.-]?\d){8,10}(?!\d)/.test(text)) found.push('số điện thoại');
  return found;
}

/** Tên file an toàn: bỏ dấu, chỉ giữ chữ-số-gạch. */
export function slug(s: string, fallback = 'phieu-trace'): string {
  const r = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return r || fallback;
}

export function formatDateTime(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
