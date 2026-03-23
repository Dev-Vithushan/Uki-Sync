import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import authIllustration from "../assets/auth-illustration.svg";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-visual">
        <p className="eyebrow">UkiSync</p>
        <h1>Plan, assign, and deliver student work with clarity.</h1>
        <p>
          One workspace for Admins, Lecturers, and Students to keep coursework and projects
          moving without confusion.
        </p>

        <ul className="auth-highlights">
          <li>Role-based access for Admin, Lecturer, and Student</li>
          <li>Ticket board with clear status flow</li>
          <li>Comments and due dates in one timeline</li>
        </ul>

        <img
          className="auth-illustration"
          src={authIllustration}
          alt="Illustration of a student task management dashboard"
        />
      </section>

      <form className="auth-card auth-card--clean" onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        <p className="auth-form-copy">Use your assigned account to access your workspace.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
