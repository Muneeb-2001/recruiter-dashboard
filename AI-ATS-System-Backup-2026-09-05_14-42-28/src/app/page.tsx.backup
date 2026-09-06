"use client";

import { ChangeEvent, FormEvent, useState } from "react";

export default function CandidateApplication() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setCv(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF, DOC, or DOCX file.");
      e.target.value = "";
      setCv(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("CV must be smaller than 10MB.");
      e.target.value = "";
      setCv(null);
      return;
    }

    setError("");
    setCv(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!cv) {
      setError("Please upload your CV.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("cv", cv);

      const response = await fetch("/api/candidates", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to submit application.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="application-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <section className="success-card">
          <div className="success-icon">✓</div>

          <p className="eyebrow">APPLICATION RECEIVED</p>

          <h1>Thank you, {name.split(" ")[0]}.</h1>

          <p className="success-text">
            Your application has been successfully submitted. We appreciate
            your interest and will review your information carefully.
          </p>

          <div className="submitted-details">
            <div>
              <span>Name</span>
              <strong>{name}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{email}</strong>
            </div>

            <div>
              <span>CV</span>
              <strong>{cv?.name}</strong>
            </div>
          </div>

          <p className="footer-note">
            You may now close this window.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="application-page">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <section className="application-shell">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">AI ATS</div>
            <div className="brand-subtitle">Talent Application</div>
          </div>
        </div>

        <div className="content">
          <div className="intro">
            <div className="eyebrow">
              <span className="status-dot" />
              APPLICATION
            </div>

            <h1>
              Submit your
              <br />
              application.
            </h1>

            <p>
              Please provide your details and latest CV to submit your
              application.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="application-form">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="cv">CV / Resume</label>

              <label
                htmlFor="cv"
                className={`upload-box ${cv ? "has-file" : ""}`}
              >
                <div className="upload-icon">
                  {cv ? "✓" : "↑"}
                </div>

                <div className="upload-content">
                  <strong>
                    {cv ? cv.name : "Choose your CV"}
                  </strong>

                  <span>
                    {cv
                      ? `${(cv.size / 1024 / 1024).toFixed(2)} MB`
                      : "PDF, DOC or DOCX · Max 10MB"}
                  </span>
                </div>

                <span className="upload-action">
                  {cv ? "Change" : "Browse"}
                </span>
              </label>

              <input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={loading}
                hidden
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit application
                  <span>→</span>
                </>
              )}
            </button>

            <p className="privacy-note">
              By submitting this application, you confirm that the information
              provided is accurate.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
