import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context";

export default function LoginPage() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(trimmedUser, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>Renewal Portal Login</h1>
        <p className="muted">Use your account username and password. This is not an email login.</p>
        <p className="muted small">
          This browser profile keeps one active login at a time. Use an incognito window or another browser profile to
          test multiple roles simultaneously.
        </p>
        <form
          onSubmit={onSubmit}
          className="form-grid"
          autoComplete="off"
          method="post"
          noValidate
        >
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            name="login_username"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            placeholder="Username"
            aria-label="Username"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="login_password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
