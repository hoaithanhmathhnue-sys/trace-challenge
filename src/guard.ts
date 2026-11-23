/**
 * Chống bấm đúp liên tiếp vào nút Xóa (tránh xóa nhầm dòng kế tiếp khi danh sách dồn lên).
 */
let last = 0;
export function allowDelete(ms = 700): boolean {
  const now = Date.now();
  if (now - last < ms) return false;
  last = now;
  return true;
}
