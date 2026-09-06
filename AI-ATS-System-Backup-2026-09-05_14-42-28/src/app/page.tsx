'use client';

import { ChangeEvent, FormEvent, useRef, useState } from "react";

export default function CandidateApplication() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!name.trim()) {
      setError("Full name is required.");
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError("Email address is required.");
      setLoading(false);
      return;
    }
    if (!area) {
      setError("Please select an area.");
      setLoading(false);
      return;
    }
    if (!cv) {
      setError("Please upload your CV.");
      setLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("area", area);
      formData.append("cv", cv);
      const response = await fetch("/api/candidates", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.successTitle}>Application Submitted!</h1>
          <p style={styles.successText}>Thank you, {name}! Your application has been received.</p>
          <div style={styles.successDetails}>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Area:</strong> {area}</p>
            {cv && <p><strong>CV:</strong> {cv.name}</p>}
          </div>
          <p style={styles.successSubtext}>Our team will review your application and contact you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Full name</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          style={styles.input}
        />

        <h2 style={styles.title}>Email address</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={styles.input}
        />

        <h2 style={styles.title}>Area</h2>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          style={styles.select}
        >
          <option value="">Select an area</option>
          <option value="Revenue/Sales">Revenue/Sales</option>
          <option value="Operational Support">Operational Support</option>
          <option value="Digital Content & Media">Digital Content & Media</option>
          <option value="Web Designer">Web Designer</option>
          <option value="Automations">Automations</option>
          <option value="Recruitment">Recruitment</option>
          <option value="Finance">Finance</option>
        </select>

        <h2 style={styles.title}>CV / Resume</h2>
        <div style={styles.uploadArea} onClick={handleUploadClick}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          {cv ? (
            <div style={styles.fileSelected}>
              <span style={styles.fileIcon}>📄</span>
              <span style={styles.fileName}>{cv.name}</span>
              <span style={styles.fileSize}>{(cv.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ) : (
            <div>
              <p style={styles.uploadText}>Choose your CV</p>
              <p style={styles.uploadSubtext}>PDF, DOC or DOCX - Max 10MB</p>
            </div>
          )}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading ? "Submitting..." : "Submit application"}
          </button>
        </form>

        <p style={styles.terms}>By submitting this application, you confirm that the information provided is accurate.</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Satoshi', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    maxWidth: "560px",
    width: "100%",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "40px 36px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#0d1b2a",
    margin: "0 0 6px 0",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#0d1b2a",
    backgroundColor: "#ffffff",
    outline: "none",
    marginBottom: "20px",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#0d1b2a",
    backgroundColor: "#ffffff",
    outline: "none",
    marginBottom: "20px",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
    appearance: "auto",
  },
  uploadArea: {
    border: "2px dashed #e2e8f0",
    borderRadius: "12px",
    padding: "32px 20px",
    textAlign: "center",
    backgroundColor: "#fafbfc",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "border-color 0.2s",
  },
  uploadText: {
    fontSize: "15px",
    color: "#0d1b2a",
    margin: 0,
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  uploadSubtext: {
    fontSize: "12px",
    color: "#718096",
    margin: "4px 0 0 0",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  fileSelected: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  fileIcon: {
    fontSize: "24px",
  },
  fileName: {
    fontSize: "14px",
    color: "#0d1b2a",
    fontWeight: 500,
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  fileSize: {
    fontSize: "12px",
    color: "#718096",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  fileInput: {
    display: "none",
  },
  error: {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    fontSize: "14px",
    marginBottom: "16px",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#124559",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: "4px",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  buttonDisabled: {
    width: "100%",
    padding: "14px",
    background: "#94a3b8",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    fontWeight: 600,
    cursor: "not-allowed",
    marginTop: "4px",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  terms: {
    fontSize: "12px",
    color: "#718096",
    textAlign: "center",
    margin: "16px 0 0 0",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  successIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    textAlign: "center",
  },
  successTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#0d1b2a",
    textAlign: "center",
    margin: "0 0 8px 0",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  successText: {
    fontSize: "16px",
    color: "#4a5568",
    textAlign: "center",
    margin: "0 0 16px 0",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  successDetails: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "16px 20px",
    textAlign: "left",
    marginBottom: "16px",
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
  successSubtext: {
    fontSize: "14px",
    color: "#718096",
    textAlign: "center",
    margin: 0,
    fontFamily: "'Satoshi', 'Inter', sans-serif",
  },
};


