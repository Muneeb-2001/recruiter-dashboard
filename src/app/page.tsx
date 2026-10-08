"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success === true && data.authenticated === true) {
        router.push("/dashboard");
        return;
      }

      router.push("/access-denied");
    } catch {
      setError("Unable to connect to the login service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          border: "1px solid #dbe4ea",
          borderRadius: "18px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "14px",
              background: "#124559",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            ATS
          </div>

          <p
            style={{
              margin: "0 0 6px",
              color: "#124559",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Recruitment
          </p>

          <h1
            style={{
              margin: 0,
              color: "#172033",
              fontSize: "30px",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Recruiter Login
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#64748b",
              fontSize: "15px",
              lineHeight: 1.5,
            }}
          >
            Sign in to access your talent workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Enter your email"
            required
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              boxSizing: "border-box",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "0 14px",
              fontSize: "15px",
              color: "#172033",
              outline: "none",
              marginBottom: "20px",
              background: "#ffffff",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            required
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              boxSizing: "border-box",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "0 14px",
              fontSize: "15px",
              color: "#172033",
              outline: "none",
              marginBottom: "14px",
              background: "#ffffff",
            }}
          />

          {error && (
            <div
              style={{
                marginBottom: "18px",
                padding: "11px 12px",
                borderRadius: "9px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "14px",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              border: "none",
              borderRadius: "10px",
              background: loading ? "#6b8792" : "#124559",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}


