"use client";

import { useRouter } from "next/navigation";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          border: "1px solid #dbe4ea",
          borderRadius: "18px",
          padding: "40px",
          boxSizing: "border-box",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 22px",
            borderRadius: "16px",
            background: "#124559",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            fontWeight: 800,
          }}
        >
          !
        </div>

        <p
          style={{
            margin: "0 0 8px",
            color: "#124559",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Recruitment System
        </p>

        <h1
          style={{
            margin: "0 0 14px",
            color: "#172033",
            fontSize: "30px",
            lineHeight: 1.2,
            fontWeight: 800,
          }}
        >
          Access Restricted
        </h1>

        <p
          style={{
            margin: "0 auto 12px",
            maxWidth: "430px",
            color: "#475569",
            fontSize: "16px",
            lineHeight: 1.6,
          }}
        >
          You are not authorized to access the ATS dashboard.
        </p>

        <p
          style={{
            margin: "0 auto 26px",
            maxWidth: "430px",
            color: "#64748b",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          The email address or password you entered is not associated with
          an authorized recruiter account in our system.
        </p>

        <div
          style={{
            marginBottom: "26px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#64748b",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          If you believe this is an error, please contact your system
          administrator.
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            width: "100%",
            maxWidth: "280px",
            height: "48px",
            border: "none",
            borderRadius: "10px",
            background: "#124559",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Return to Login
        </button>
      </div>
    </main>
  );
}
