// src/view/Account/Login.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import * as api from "../../api";
import Session from "../../Session/session";
import { demoLoginAccounts } from "../../config/demoLogin";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) setNotice(location.state.message);
    const demoCredentials = location.state?.demoCredentials;
    if (!demoCredentials) return;

    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError("");
    setNotice("");
  }, [location.state]);

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setNotice("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const user = await api.login({ email, password });
      if (user && user.id && user.token) {
        Session.setUser(user.id, user.username, user.role, user.email, user.token);
        setUser(user);
        navigate(location.state?.returnTo || "/");
      } else {
        setError("Email hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi đăng nhập. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-heading">
        <aside className="auth-card__aside">
          <Link to="/" className="auth-brand"><span aria-hidden="true">C</span> COOLSHOP</Link>
          <div className="auth-card__message">
            <span className="auth-kicker">BẮT ĐẦU TỪ ĐÂY</span>
            <h1>Mua sắm dễ dàng, vận động tự tin.</h1>
            <p>Đăng nhập để xem đơn hàng, lưu địa chỉ và tiếp tục khám phá các sản phẩm phù hợp với bạn.</p>
          </div>
          <Link to="/" className="auth-back">← Quay lại cửa hàng</Link>
        </aside>

        <div className="auth-card__form-wrap">
          <div className="auth-form-heading">
            <span className="auth-kicker">TÀI KHOẢN COOLSHOP</span>
            <h2 id="login-heading">Đăng nhập</h2>
            <p>Nhập email và mật khẩu để tiếp tục.</p>
          </div>

          {notice && !error && <div className="auth-notice" role="status">{notice}</div>}

          {error && (
            <div className="auth-alert" role="alert">
              <span aria-hidden="true">!</span><span>{error}</span>
            </div>
          )}

          {demoLoginAccounts.length > 0 && (
            <section className="demo-accounts" aria-label="Tài khoản trải nghiệm">
              <div className="demo-accounts__heading">
                <b>Dùng thử cửa hàng</b>
                <span>Chọn tài khoản để điền nhanh</span>
              </div>
              <div className="demo-accounts__actions">
                {demoLoginAccounts.map((account) => (
                  <button key={account.label} type="button" onClick={() => fillDemoAccount(account)}>
                    {account.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <label htmlFor="login-email">Địa chỉ email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="ten@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="auth-password-label">
              <label htmlFor="login-password">Mật khẩu</label>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>
            <div className="auth-password-input">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Tạo tài khoản mới</Link></p>
        </div>
      </section>
    </main>
  );
}
