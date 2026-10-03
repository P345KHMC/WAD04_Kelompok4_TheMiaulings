import { useState } from "react";
import { login } from "../services/authService.js";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [kirim, setKirim] = useState(false);

  async function tanganiSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setKirim(true);
    setError("");
    try {
      onLogin(await login(username.trim(), password));
    } catch (err) {
      setError(err.message);
    } finally {
      setKirim(false);
    }
  }

  return (
    <div className="login">
      <div className="login-side">
        <h1>Warkop Kita</h1>
        <p>Coffee shop management: menu, pesanan, dan laporan dalam satu tempat.</p>
      </div>

      <form className="login-form" onSubmit={tanganiSubmit} noValidate>
        <h2>Masuk</h2>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={kirim}>
          {kirim ? "Memproses..." : "Masuk"}
        </button>
        <p className="login-note">Akun demo: admin / admin123 · kasir / kasir123</p>
      </form>
    </div>
  );
}

export default Login;
