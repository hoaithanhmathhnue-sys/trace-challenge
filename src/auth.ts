// Cổng đăng nhập phía trình duyệt (Client-side Login Gate) và thông tin Tác giả.
// Không lưu tài khoản hay mật khẩu dạng chữ rõ trong mã nguồn; chỉ so khớp mã băm SHA-256.

export const AUTHOR_INFO = {
  name: 'Trần Thị Kim Thoa',
  role: 'Giáo viên Tin học',
  school: 'Trường THPT Hoàng Diệu',
  address: 'Số 1 Mạc Đĩnh Chi, phường Phú Lợi, thành phố Cần Thơ',
  topicTitle: 'Biện pháp 02 – Trace Challenge: Dự đoán đường đi của thuật toán',
  topicFull:
    'Sử dụng thử thách dự đoán trạng thái biến nhằm phát triển tư duy thuật toán trong dạy học lập trình Tin học THPT',
  scope: 'Tin học 10 (Rẽ nhánh, Vòng lặp – Bài 19, 20, 21) & Tin học 11 định hướng Khoa học máy tính (Tìm kiếm, Sắp xếp)',
  avatarUrl: '/avatar.jpg',
  logoUrl: '/logo.jpg',
};

const AUTH_STORAGE_KEY = 'tc.v1.auth';

// Mã băm SHA-256 của chuỗi 'tracechallenge:v1:' + stripVN(user) + ':' + pass
export const AUTH_HASH = 'e6ecd4e16541c28f7b6dafe29d82a3020b30b7a719869e2e9d814f2118bc52e3';

/** Chuẩn hóa tên đăng nhập: bỏ dấu tiếng Việt (kể cả đ/Đ), chuyển chữ thường, gộp khoảng trắng thừa. */
export function stripVN(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hàm băm SHA-256 thuần TypeScript/JS (chạy được trên mọi môi trường, kể cả http:// LAN không có crypto.subtle). */
export function sha256(ascii: string): string {
  const rr = (v: number, a: number) => (v >>> a) | (v << (32 - a));
  const mp = Math.pow;
  const mw = mp(2, 32);
  let result = '';
  const words: number[] = [];
  const bitLen = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let pc = 0;
  const comp: Record<number, number> = {};
  for (let c = 2; pc < 64; c++) {
    if (!comp[c]) {
      for (let i = 0; i < 313; i += c) comp[i] = c;
      hash[pc] = (mp(c, 0.5) * mw) | 0;
      k[pc++] = (mp(c, 1 / 3) * mw) | 0;
    }
  }

  let padded = ascii + '\x80';
  while ((padded.length % 64) - 56 !== 0) padded += '\x00';
  for (let i = 0; i < padded.length; i++) {
    const j = padded.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] = (words[i >> 2] || 0) | (j << (((3 - i) % 4) * 8));
  }
  words[words.length] = (bitLen / mw) | 0;
  words[words.length] = bitLen;

  let h = hash.slice(0, 8);
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const old = h.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const a = h[0];
      const e = h[4];
      const s1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & h[5]) ^ (~e & h[6]);
      const wi = (w[i] =
        i < 16
          ? w[i] || 0
          : ((w[i - 16] || 0) +
              (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) +
              (w[i - 7] || 0) +
              (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) |
            0);
      const t1 = (h[7] + s1 + ch + k[i] + wi) | 0;
      const s0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const maj = (a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]);
      const t2 = (s0 + maj) | 0;
      h = [(t1 + t2) | 0, h[0], h[1], h[2], (h[3] + t1) | 0, h[4], h[5], h[6]];
    }
    for (let i = 0; i < 8; i++) h[i] = (h[i] + old[i]) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (h[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function computeAuthToken(username: string, password: string): string {
  const normUser = stripVN(username);
  // Chỉ giữ ký tự ASCII cho chuỗi đầu vào của sha256
  const cleanPass = String(password || '').trim().replace(/[^\x20-\x7E]/g, '');
  return sha256(`tracechallenge:v1:${normUser}:${cleanPass}`);
}

export function isAuthenticated(): boolean {
  try {
    return window.sessionStorage.getItem(AUTH_STORAGE_KEY) === AUTH_HASH;
  } catch {
    return false;
  }
}

let failCount = 0;
let lockUntil = 0;

export function verifyLogin(
  username: string,
  password: string,
): { ok: true } | { ok: false; waitSeconds: number } {
  const now = Date.now();
  if (now < lockUntil) {
    return { ok: false, waitSeconds: Math.ceil((lockUntil - now) / 1000) };
  }
  if (computeAuthToken(username, password) === AUTH_HASH) {
    failCount = 0;
    lockUntil = 0;
    try {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, AUTH_HASH);
    } catch {
      /* ignore if sessionStorage blocked */
    }
    return { ok: true };
  }
  failCount++;
  if (failCount >= 4) {
    lockUntil = now + Math.min(30, failCount * 3) * 1000;
  }
  return { ok: false, waitSeconds: 0 };
}

export function clearAuthSession(): void {
  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
