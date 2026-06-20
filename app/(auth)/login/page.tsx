"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "2rem" }}>
          <div
            style={{
              background: "var(--color-primary)",
              borderRadius: "0.625rem",
              padding: "0.5rem",
              display: "flex",
            }}
          >
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.025em", color: "var(--text-primary)" }}>
              WorkPulse
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Employee Management System
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.375rem" }}>
          Sign in to your account
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 1.5rem" }}>
          Enter your credentials to continue
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                  display: "flex",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            {loading ? (
              <><span className="spinner spinner-sm" /> Signing in…</>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <hr className="divider" style={{ margin: "1.5rem 0" }} />
        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Need an account?{" "}
          <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
