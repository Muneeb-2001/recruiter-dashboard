'use client';

import { useEffect, useMemo, useState } from "react";

type Candidate = {
  id: string;
  name: string;
  email: string;
  area: string;
  attachment: any[];
  date: string;
  status: string;
  score: number | null;
  recommendation: string;
  summary: string;
  strength: string;
  gap: string;
  experience: string;
  skills: string;
  skillsMatchScore: number | null;
  experienceMatch: number | null;
  languageFitscore: number | null;
  interviewStatus?: string;
};

function formatDate(value: string) {
  if (!value) return "✕";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getScoreColor(score: number | null) {
  if (score === null) return "#7c3aed";
  if (score >= 85) return "#10b981";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusStyle(status: string | undefined) {
  if (status === "Invitation Send" || status === "Interview Link Send") {
    return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  }
  if (status === "Invitation Done") {
    return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  }
  if (status === "Interview Done") {
    return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  }
  return { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
}
export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  async function loadCandidates() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/candidates", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load candidates.");
      }
      setCandidates((data.candidates || []).map((c: any) => ({ ...c, score: c.atsScore ?? c.score ?? null, skillsMatchScore: c.skillMatchScore ?? c.skillsMatchScore ?? null, experienceMatch: c.experienceMatchScore ?? c.experienceMatch ?? null, strength: c.strengths ?? c.strength ?? "", gap: c.gaps ?? c.gap ?? "" })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  const stats = useMemo(() => {
    const total = candidates.length;
    return { total };
  }, [candidates]);
  const filteredCandidates = candidates.filter((candidate) => {
    const searchTerm = search.toLowerCase().trim();

    const matchesSearch =
      candidate.name?.toLowerCase().includes(searchTerm) ||
      candidate.email?.toLowerCase().includes(searchTerm) ||
      candidate.area?.toLowerCase().includes(searchTerm);

    const candidateDate = candidate.date
      ? new Date(candidate.date).toISOString().split("T")[0]
      : "";

    const matchesDate =
      !selectedDate || candidateDate === selectedDate;

    return matchesSearch && matchesDate;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;

    return dateB - dateA;
  });

  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / pageSize));

  const paginatedCandidates = sortedCandidates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  );
  const primaryColor = "#124559";

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{...styles.logo, background: primaryColor}}>ATS</div>
          <div>
            <p style={styles.sidebarTitle}>Recruitment</p>
            <p style={styles.sidebarSubtitle}>Talent workspace</p>
          </div>
        </div>
        <div style={{...styles.statsRow, marginLeft: "-12px"}}>
          <div style={{...styles.statCard, borderColor: primaryColor + '20'}}>
            <div style={{...styles.statHeader, justifyContent: "center", paddingLeft: "12px"}}>
              <p style={styles.statLabel}>Total candidates</p>
              <span style={{...styles.statIcon, color: primaryColor}}></span>
            </div>
            <p style={{...styles.statValue, textAlign: "center", paddingLeft: "12px"}}>{stats.total}</p>
            <p style={{...styles.statDesc, textAlign: "center", paddingLeft: "12px"}}>All applications</p>
          </div>
        </div>
        <div style={{...styles.sidebarScoreGuide, marginLeft: '18px', marginTop: '4px'}}>
          <p style={styles.sidebarGuideTitle}>ATS Score Guide</p>
          <div style={styles.sidebarGuideItem}>
            <span style={{...styles.sidebarDot, backgroundColor: '#10b981'}}></span>
            <span style={styles.sidebarGuideText}><strong>85+</strong> Strong Match</span>
          </div>
          <div style={styles.sidebarGuideItem}>
            <span style={{...styles.sidebarDot, backgroundColor: '#3b82f6'}}></span>
            <span style={styles.sidebarGuideText}><strong>65–84</strong> Good Match</span>
          </div>
          <div style={styles.sidebarGuideItem}>
            <span style={{...styles.sidebarDot, backgroundColor: '#f59e0b'}}></span>
            <span style={styles.sidebarGuideText}><strong>50–64</strong> Moderate Match</span>
          </div>
          <div style={styles.sidebarGuideItem}>
            <span style={{...styles.sidebarDot, backgroundColor: '#ef4444'}}></span>
            <span style={styles.sidebarGuideText}><strong>Below 50</strong> Low Match</span>
          </div>
          <div style={styles.sidebarGuideItem}>
            <span style={{...styles.sidebarDot, backgroundColor: '#7c3aed'}}></span>
            <span style={styles.sidebarGuideText}><strong>Duplicate Application</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <p style={{...styles.headerBadge, color: primaryColor}}>Recruitment</p>
            <h1 style={styles.headerTitle}>Recruiter Dashboard</h1>
          </div>
          <button onClick={loadCandidates} disabled={loading} style={{...styles.refreshBtn, borderColor: primaryColor + '40', color: primaryColor}}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div style={styles.content}>
          {error && <div style={styles.error}>{error}</div>}

          {/* Candidates Table */}
          <div style={{...styles.tableCard, borderColor: primaryColor + '20'}}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                padding: '18px 20px',
              }}
            >
              <div style={{ flex: '1 1 220px', minWidth: '220px' }}>
                <h3 style={styles.tableTitle}>Candidates</h3>
                <p style={styles.tableSubtitle}>
                  Live candidate data from Airtable.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >

                {/* Date Filter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    height: '38px',
                    padding: '0 11px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '9px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#64748b',
                    }}
                  >
                  </span>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#334155',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  />

                  {selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setCurrentPage(1);
                      }}
                      title="Clear date filter"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        fontSize: '17px',
                        cursor: 'pointer',
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Pagination */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '38px',
                    padding: '0 5px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '9px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      ...styles.pageButton,
                      minWidth: '32px',
                      width: '32px',
                      height: '30px',
                      padding: 0,
                      border: 'none',
                      color:
                        currentPage === 1
                          ? '#cbd5e1'
                          : primaryColor,
                      backgroundColor: 'transparent',
                      cursor:
                        currentPage === 1
                          ? 'default'
                          : 'pointer',
                    }}
                  >
                    ‹
                  </button>

                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        ...styles.pageButton,
                        minWidth: '32px',
                        width: '32px',
                        height: '30px',
                        padding: 0,
                        border:
                          currentPage === page
                            ? '1px solid ' + primaryColor
                            : '1px solid transparent',
                        borderRadius: '7px',
                        color:
                          currentPage === page
                            ? '#ffffff'
                            : '#475569',
                        backgroundColor:
                          currentPage === page
                            ? primaryColor
                            : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(totalPages, p + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.pageButton,
                      minWidth: '32px',
                      width: '32px',
                      height: '30px',
                      padding: 0,
                      border: 'none',
                      color:
                        currentPage === totalPages
                          ? '#cbd5e1'
                          : primaryColor,
                      backgroundColor: 'transparent',
                      cursor:
                        currentPage === totalPages
                          ? 'default'
                          : 'pointer',
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Search */}
                <div
                  style={{
                    ...styles.searchBox,
                    height: '38px',
                  }}
                >
                  <span style={styles.searchIcon}></span>

                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search candidates..."
                    style={{
                      ...styles.searchInput,
                      borderColor: primaryColor + '30',
                    }}
                  />
                </div>

              </div>
            </div>            {loading ? (
              <div style={styles.loadingState}>
                <div style={{...styles.spinner, borderTopColor: primaryColor}}></div>
                <p style={styles.loadingText}>Loading candidates...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No candidates found</p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{...styles.trHeader, borderColor: primaryColor + '15'}}>
                      <th style={{...styles.th, width: '20%'}}>Candidate</th>
                      <th style={{...styles.th, width: '12%'}}>Date</th>
                      <th style={{...styles.th, width: '12%'}}>Area</th>
                      <th style={{...styles.th, width: '10%'}}>ATS Score</th>
                      <th style={{...styles.th, width: '15%'}}>AI Summary</th>
                      <th style={{...styles.th, width: '16%'}}>Interview Status</th>
                      <th style={{...styles.thAction, width: '15%'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map((candidate) => (
                      <tr key={candidate.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.candidateInfo}>
                            <div style={{...styles.avatar, background: primaryColor + '15', color: primaryColor}}>
                              {getInitials(candidate.name)}
                            </div>
                            <div>
                              <p style={styles.candidateName}>{candidate.name || "Unnamed"}</p>
                              <p style={styles.candidateEmail}>{candidate.email || "No email"}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{...styles.td, whiteSpace: 'nowrap'}}>{formatDate(candidate.date)}</td>
                        <td style={styles.td}>{candidate.area || "—"}</td>
                        <td style={styles.td}>
                          <span style={{...styles.scoreBadge, backgroundColor: candidate.score === null ? '#ede9fe' : getScoreColor(candidate.score) + '20', color: getScoreColor(candidate.score)}}>
                            {candidate.score ?? "Duplicate"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => setSelected(candidate)} style={{...styles.viewBtn, background: primaryColor}}>
                            View report
                          </button>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusStyle(candidate.interviewStatus).backgroundColor,
                            color: getStatusStyle(candidate.interviewStatus).color,
                            border: getStatusStyle(candidate.interviewStatus).border,
                          }}>
                            {candidate.interviewStatus || "—"}
                          </span>
                        </td>
                        <td style={styles.tdAction}>
                          {candidate.interviewStatus === "Invitation Send" || candidate.interviewStatus === "Interview Link Send" || candidate.interviewStatus === "Invitation Done" || candidate.interviewStatus === "Interview Done" ? (
  <span style={{
    ...styles.sendBtn,
    background: candidate.interviewStatus === "Interview Done" ? "#16a34a" : candidate.interviewStatus === "Invitation Done" ? "#22c55e" : "#d97706",
    cursor: "not-allowed",
    opacity: 0.85,
    display: "inline-block",
    textAlign: "center",
    padding: "8px 14px",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  }}>
    {candidate.interviewStatus === "Interview Done" ? "✓ Interview Done" : candidate.interviewStatus === "Invitation Done" ? "✓ Invitation Done" : "✓ Invitation Sent"}
  </span>
) : (
  <button onClick={() => setInterviewCandidate(candidate)} style={{...styles.sendBtn, background: primaryColor, cursor: "pointer", opacity: 1}}>
    Send link
  </button>
)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* <span
  style={{
    display: 'block',
    fontSize: '13px',
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1.8px',
    lineHeight: 1.3,
  }}
>
  Candidate Report
</span> Modal */}
      {selected && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              ...styles.modal,
              maxWidth: '760px',
              width: 'calc(100% - 32px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                ...styles.modalHeader,
                borderColor: primaryColor + '15',
              }}
            >
              <div>
                <div style={{ marginTop: '6px' }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#334155',
                      lineHeight: 1.4,
                    }}
                  >
                    {selected.name || "Unnamed"}
                  </div>
                  <div
                    style={{
                      marginTop: '2px',
                      fontSize: '13px',
                      fontWeight: 400,
                      color: '#94a3b8',
                      lineHeight: 1.4,
                    }}
                  >
                    {selected.email || "No email"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={styles.modalClose}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>

              {/* Top Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={styles.modalStatLabel}>ATS Score</p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '30px',
                      fontWeight: 800,
                      color: getScoreColor(selected.score),
                    }}
                  >
                    {selected.score ?? "—"}
                  </p>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={styles.modalStatLabel}>Recommendation</p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {selected.recommendation || "—"}
                  </p>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={styles.modalStatLabel}>Area</p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {selected.area || "—"}
                  </p>
                </div>
              </div>

              {/* Match Scores */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '14px',
                  marginBottom: '22px',
                }}
              >
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <p style={styles.modalStatLabel}>
                    Skill Match Score
                  </p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: getScoreColor(selected.skillsMatchScore),
                    }}
                  >
                    {selected.skillsMatchScore ?? "—"}
                  </p>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <p style={styles.modalStatLabel}>
                    Experience Match Score
                  </p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: getScoreColor(selected.experienceMatch),
                    }}
                  >
                    {selected.experienceMatch ?? "—"}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <h3 style={styles.reportSectionTitle}>
                  Summary
                </h3>

                <p
                  style={{
                    ...styles.reportText,
                    lineHeight: 1.7,
                    marginTop: '10px',
                  }}
                >
                  {selected.summary || "No summary available."}
                </p>
              </div>

              {/* Strengths */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <h3 style={styles.reportSectionTitle}>
                  Strengths
                </h3>

                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                  }}
                >
                  {(selected.strength || "")
                    .split(/\r?\n|(?<=\.)\s+(?=[A-Z])/)
                    .map((item, index) => item.trim())
                    .filter(Boolean)
                    .map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#f8fafc',
                          color: '#334155',
                          fontSize: '14px',
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            color: '#10b981',
                            fontWeight: 800,
                            fontSize: '16px',
                            lineHeight: 1.4,
                          }}
                        >
                          ✓
                        </span>

                        <span>{item}</span>
                      </div>
                    ))}

                  {!selected.strength && (
                    <p style={styles.reportText}>
                      No strengths available.
                    </p>
                  )}
                </div>
              </div>

              {/* Gaps */}
              <div
                style={{
                  marginBottom: '4px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <h3 style={styles.reportSectionTitle}>
                  Gaps
                </h3>

                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                  }}
                >
                  {(selected.gap || "")
                    .split(/\r?\n|(?<=\.)\s+(?=[A-Z])/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#f8fafc',
                          color: '#334155',
                          fontSize: '14px',
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            color: '#ef4444',
                            fontWeight: 800,
                            fontSize: '16px',
                            lineHeight: 1.4,
                          }}
                        >
                          ⚠
                        </span>

                        <span>{item}</span>
                      </div>
                    ))}

                  {!selected.gap && (
                    <p style={styles.reportText}>
                      No gaps available.
                    </p>
                  )}
                </div>
              </div>


              {/* Candidate CV / Airtable Attachment */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <h3 style={styles.reportSectionTitle}>
                  Candidate CV / Attachment
                </h3>

                {Array.isArray(selected.attachment) && selected.attachment.length > 0 ? (
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {selected.attachment.map((file: any, index: number) => {
                      const fileUrl = file?.url || '';
                      const fileName = file?.filename || `Attachment ${index + 1}`;
                      const fileType = file?.type || '';
                      const isPdf =
                        fileType.toLowerCase().includes('pdf') ||
                        fileName.toLowerCase().endsWith('.pdf');
                      const isImage =
                        fileType.toLowerCase().startsWith('image/');

                      return (
                        <div
                          key={file?.id || index}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: '#334155',
                                  fontSize: '14px',
                                }}
                              >
                                {fileName}
                              </div>

                              {file?.size && (
                                <div
                                  style={{
                                    marginTop: '3px',
                                    color: '#64748b',
                                    fontSize: '12px',
                                  }}
                                >
                                  {Math.round(file.size / 1024)} KB
                                </div>
                              )}
                            </div>

                            {fileUrl && (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    borderRadius: '7px',
                                    backgroundColor: primaryColor,
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                  }}
                                >
                                  View CV
                                </a>

                                <a
                                  href={fileUrl}
                                  download={fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    borderRadius: '7px',
                                    backgroundColor: '#e2e8f0',
                                    color: '#334155',
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                  }}
                                >
                                  Download
                                </a>
                              </div>
                            )}
                          </div>

                          {fileUrl && isPdf && (
                            <iframe
                              src={fileUrl}
                              title={fileName}
                              style={{
                                width: '100%',
                                height: '500px',
                                marginTop: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                              }}
                            />
                          )}

                          {fileUrl && isImage && (
                            <img
                              src={fileUrl}
                              alt={fileName}
                              style={{
                                display: 'block',
                                maxWidth: '100%',
                                maxHeight: '500px',
                                marginTop: '14px',
                                borderRadius: '8px',
                                objectFit: 'contain',
                                backgroundColor: '#ffffff',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p
                    style={{
                      ...styles.reportText,
                      marginTop: '10px',
                      color: '#64748b',
                    }}
                  >
                    No CV attachment available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Interview Modal */}
      {interviewCandidate && (
        <div style={styles.modalOverlay} onClick={() => setInterviewCandidate(null)}>
          <div style={{...styles.modal, maxWidth: '480px', borderColor: primaryColor + '20'}} onClick={(e) => e.stopPropagation()}>
            <div style={{...styles.modalHeader, borderColor: primaryColor + '15'}}>
              <h2 style={{...styles.modalTitle, color: primaryColor}}>Send AI Interview Link?</h2>
              <button onClick={() => setInterviewCandidate(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>Are you sure you want to send the AI interview link to this candidate?</p>
              <div style={{...styles.interviewCandidateBox, borderColor: primaryColor + '20'}}>
                <p style={styles.interviewCandidateName}>{interviewCandidate.name}</p>
                <p style={styles.interviewCandidateEmail}>{interviewCandidate.email}</p>
              </div>
              <div style={styles.modalActions}>
                <button onClick={() => setInterviewCandidate(null)} style={styles.cancelBtn}>Cancel</button>
                <button onClick={async () => {
                  if (!interviewCandidate) return;
                  try {
                    const response = await fetch("https://n8n.domingogarcia.info/webhook/dc5cd16e-f565-4660-a365-0533087649f3", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        recordId: interviewCandidate.id,
                        name: interviewCandidate.name || "",
                        email: interviewCandidate.email || "",
                        area: interviewCandidate.area || "",
                      }),
                    });
                    const result = await response.json();
                    if (!response.ok) {
                      console.error("Failed to send interview webhook:", result);
                      return;
                    }
                    setCandidates((prev) =>
                      prev.map((c) =>
                        c.id === interviewCandidate.id
                          ? { ...c, interviewStatus: "Interview Link Send" }
                          : c
                      )
                    );
                    setInterviewCandidate(null);
                  } catch (error) {
                    console.error("Interview webhook request failed:", error);
                  }
                }} style={{...styles.confirmBtn, background: primaryColor}}>
                  Yes, Send Interview Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {    minHeight: '100vh', background: 'radial-gradient(circle at 15% 10%, rgba(45,132,158,0.14), transparent 30%), linear-gradient(135deg, #eef7fa 0%, #f8fafc 48%, #e6f1f5 100%)', color: '#0f172a',
  },
  sidebar: {    width: '256px', background: 'linear-gradient(180deg, #ffffff 0%, #f3f9fb 55%, #eaf4f7 100%)', borderRight: '1px solid #d5e5eb', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, boxShadow: '8px 0 30px rgba(18,69,89,0.12)', zIndex: 10,
  },
  sidebarHeader: {    display: 'flex', alignItems: 'center', gap: '13px', padding: '24px 24px', background: 'linear-gradient(135deg, #ffffff 0%, #e8f5f8 100%)', borderBottom: '1px solid #d7e8ee',
  },
  logo: {    width: '46px', height: '46px', borderRadius: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', background: 'linear-gradient(135deg, #0d3f52 0%, #176b82 55%, #218da3 100%)', boxShadow: '0 10px 22px rgba(18,69,89,0.30)', letterSpacing: '0.5px',
  },
  sidebarTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  sidebarSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '3px 0 0',
    fontWeight: '500',
  },
  sidebarScoreGuide: {    padding: '18px 12px',
    marginTop: '16px',
    marginRight: '16px',
    marginBottom: '12px',
    marginLeft: '16px', borderRadius: '20px', background: 'linear-gradient(145deg, #ffffff 0%, #f2f9fb 100%)', border: '1px solid #cfe2ea', boxShadow: '0 14px 32px rgba(18,69,89,0.12)',
  },
  sidebarGuideTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#174b60',
    margin: '0 0 12px 0',
    letterSpacing: '0.2px',
  },
  sidebarGuideItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 8px',
    marginBottom: '4px',
    borderRadius: '11px',
    backgroundColor: '#ffffff',
    border: '1px solid #edf2f7',
    boxShadow: '0 3px 8px rgba(15, 23, 42, 0.07)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  sidebarDot: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  sidebarGuideText: {
    fontSize: '14px',
    color: '#475569',
  },
  mainContent: {    marginLeft: '256px', flex: 1, minHeight: '100vh', background: 'radial-gradient(circle at 90% 5%, rgba(33,141,163,0.10), transparent 28%), linear-gradient(180deg, #edf6f9 0%, #f8fafc 55%, #eef5f7 100%)',
  },
  header: {    height: '96px', padding: '0 38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #d7e6ec', boxShadow: '0 6px 24px rgba(18,69,89,0.08)',
  },
  headerBadge: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    margin: 0,
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '4px 0 0 0',
  },
  refreshBtn: {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  content: {
    maxWidth: '1500px',
    margin: '0 auto',
    padding: '28px 32px',
  },
  error: {
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    fontSize: '14px',
    marginBottom: '24px',
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  statCard: {    width: '100%', boxSizing: 'border-box', padding: '22px 24px', borderRadius: '20px', background: 'linear-gradient(145deg, #ffffff 0%, #edf8fb 100%)', borderWidth: '1px', borderStyle: 'solid', borderColor: '#c9e1ea', boxShadow: '0 14px 32px rgba(18,69,89,0.14)',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#526b82',
    margin: 0,
    letterSpacing: '0.1px',
  },
  statIcon: {
    fontSize: '18px',
  },
  statValue: {
    fontSize: '30px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '8px 0 2px 0',
    letterSpacing: '-1px',
  },
  statDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
  },
  tableCard: {    background: 'rgba(255,255,255,0.98)', borderWidth: '1px', borderStyle: 'solid', borderColor: '#d4e4ea', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 18px 45px rgba(18,69,89,0.12)', backdropFilter: 'blur(10px)',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: 0,
  },
  tableSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  searchBox: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  searchInput: {
    padding: '10px 12px 10px 36px',
    borderRadius: '12px',
    border: '1px solid',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    width: '240px',
    outline: 'none',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid',
  },
  th: {    padding: '15px 18px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#527187', background: 'linear-gradient(180deg, #eef7fa 0%, #e4f0f4 100%)', borderBottom: '1px solid #d2e3e9', letterSpacing: '0.6px',
  },
  thAction: {
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {    padding: '16px 18px', fontSize: '14px', color: '#172033', borderBottom: '1px solid #e8f0f3', backgroundColor: 'rgba(255,255,255,0.90)',
  },
  tdAction: {
    padding: '12px 16px',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  candidateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  candidateName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    margin: 0,
  },
  candidateEmail: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '4px 0 0 0',
  },
  scoreBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    minWidth: '64px',
    textAlign: 'center',
    boxSizing: 'border-box',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '48px',
    textAlign: 'center',
  },
  viewBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  sendBtn: {    border: 'none', borderRadius: '11px', padding: '9px 17px', fontSize: '12px', fontWeight: 700, color: '#ffffff', boxShadow: '0 6px 16px rgba(18,69,89,0.22)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-block',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '4px solid #e2e8f0',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#475569',
    marginTop: '12px',
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    padding: '60px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#94a3b8',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    border: '1px solid',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid',
  },
  modalUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  modalAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: 0,
  },
  modalEmail: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0 8px',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 80px)',
  },
  modalStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  modalStat: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid',
  },
  modalStatLabel: {
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#94a3b8',
    margin: 0,
  },
  modalStatValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '4px 0 0 0',
  },
  modalSection: {
    marginBottom: '16px',
  },
  modalSectionTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  modalSectionContent: {
    fontSize: '14px',
    color: '#334155',
    lineHeight: '1.7',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  modalText: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  interviewCandidateBox: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid',
    marginBottom: '20px',
  },
  interviewCandidateName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    margin: 0,
  },
  interviewCandidateEmail: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    flexWrap: 'wrap',
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  paginationText: {
    fontSize: '13px',
    color: '#64748b',
  },
  pageSizeSelect: {
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  paginationButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageButton: {
    minWidth: '36px',
    height: '36px',
    padding: '0 10px',
    borderRadius: '8px',
    border: '1px solid',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 20px',
    borderRadius: '12px',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(18, 69, 89, 0.25)',
  },
};









































































































