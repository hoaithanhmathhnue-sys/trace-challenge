import { FormEvent, useState } from 'react';
import { AUTHOR_INFO, verifyLogin } from '../auth';

export default function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = verifyLogin(username, password);
    if (res.ok) {
      setError('');
      onSuccess();
      return;
    }
    setError(
      res.waitSeconds > 0
        ? `Nhập sai nhiều lần. Vui lòng đợi ${res.waitSeconds} giây rồi thử lại.`
        : 'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.',
    );
    setPassword('');
    setShake(false);
    window.setTimeout(() => setShake(true), 10);
  };

  return (
    <div className="login-wrap">
      <div className={`login-card${shake ? ' shake' : ''}`}>
        <div className="login-brand">
          <img
            src={AUTHOR_INFO.logoUrl}
            alt={`Biểu trưng ${AUTHOR_INFO.school}`}
            className="login-logo"
            width={84}
            height={84}
          />
          <span className="hero-tag">Biện pháp 02 · Tin học 10 &amp; Tin học 11 CS</span>
          <h1 className="login-title">Trace Challenge</h1>
          <p className="login-sub">Dự đoán đường đi của thuật toán</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-user">Tên đăng nhập</label>
            <input
              id="login-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-pass">Mật khẩu</label>
            <input
              id="login-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login-err" role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <button type="submit" className="btn primary big login-btn">
            Đăng nhập vào ứng dụng
          </button>
        </form>

        <div className="login-author">
          <img
            src={AUTHOR_INFO.avatarUrl}
            alt={`Giáo viên ${AUTHOR_INFO.name}`}
            className="login-avatar"
            width={52}
            height={52}
          />
          <div>
            <div className="login-author-name">Giáo viên: {AUTHOR_INFO.name}</div>
            <div className="login-author-school">{AUTHOR_INFO.school}</div>
            <div className="login-author-addr">{AUTHOR_INFO.address}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
