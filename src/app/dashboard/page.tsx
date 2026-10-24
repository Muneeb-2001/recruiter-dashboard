'use client';

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

type Candidate = {
  rawFields?: Record<string, unknown>;
  id: string;
  name: string;
  email: string;
  area: string;
  role?: string;
  country?: string;
  salaryExpectation?: string | number;
  attachment: any;
  linkCV?: string;
  linkPortfolio?: string;
  linkLinkedIn?: string;
  videoURL?: string;
  transcriptURL?: string;
  availability?: string;
  workingHours?: string;
  employeeType?: string;
  relevantExperience?: string;
  yearsOfExperience?: string | number;
  tools?: string;
  dateOfBirth?: string;
  gender?: string;
  referralSource?: string;
  region?: string;
  positionApplied?: string;
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

function parseCandidateDate(value: unknown): Date | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Explicitly parse legacy values such as 9/16/2026 6:59pm.
  const legacy = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(am|pm))?$/i
  );

  if (legacy) {
    const month = Number(legacy[1]);
    const day = Number(legacy[2]);
    const year = Number(legacy[3]);
    let hour = legacy[4] ? Number(legacy[4]) : 0;
    const minute = legacy[5] ? Number(legacy[5]) : 0;
    const meridiem = legacy[6]?.toLowerCase();

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    if (meridiem) {
      if (hour < 1 || hour > 12) return null;
      if (meridiem === "pm" && hour !== 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;
    }

    const date = new Date(year, month - 1, day, hour, minute);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCandidateDate(value: unknown): string {
  const date = parseCandidateDate(value);
  return date ? date.toISOString() : "";
}

function formatDate(value: string) {
  const date = parseCandidateDate(value);
  if (!date) return "—";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(value: string) {
  const date = parseCandidateDate(value);
  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
  return { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #DCE5EF' };
}
export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
const [exporting, setExporting] = useState(false);
const [exportError, setExportError] = useState("");
const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [reportComment, setReportComment] = useState("");
  const [commentEditMode, setCommentEditMode] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState("");
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"Area" | "Role" | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleFullscreen, setRoleFullscreen] = useState(false);
const [editMenuPosition, setEditMenuPosition] = useState({ top: 80, left: 20 });
  const editAnchorRef = useRef<HTMLElement | null>(null);
  const editMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editingCandidateId || !editingField || roleFullscreen) return;

    const updateEditorPosition = () => {
      const anchor = editAnchorRef.current;
      if (!anchor || !anchor.isConnected) {
        setEditingCandidateId(null);
        setEditingField(null);
        return;
      }

      const rect = anchor.getBoundingClientRect();

      if (rect.bottom <= 0 || rect.top >= window.innerHeight ||
          rect.right <= 0 || rect.left >= window.innerWidth) {
        setEditingCandidateId(null);
        setEditingField(null);
        return;
      }

      const panelHeight = Math.min(
        editingField === "Role" ? 440 : 240,
        window.innerHeight - 16
      );
      const top = Math.max(8, rect.top - 6 - (editMenuRef.current?.getBoundingClientRect().height ?? panelHeight));

      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - 296)
      );

      setEditMenuPosition(previous =>
        previous.top === top && previous.left === left
          ? previous
          : { top, left }
      );
    };

    updateEditorPosition();
    window.addEventListener("scroll", updateEditorPosition, true);
    window.addEventListener("resize", updateEditorPosition);

    return () => {
      window.removeEventListener("scroll", updateEditorPosition, true);
      window.removeEventListener("resize", updateEditorPosition);
    };
  }, [editingCandidateId, editingField, roleFullscreen]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState("");
  useEffect(() => {
    if (!editingCandidateId || !editingField) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

if (target.closest('[data-area-role-edit-menu="true"]') || target.closest('[data-role-dropdown-options="true"]')) { return; }
      if (!target.closest('[data-area-role-edit-menu="true"]') && !target.closest('[data-role-dropdown-options="true"]')) {
      setEditingCandidateId(null);
      setEditingField(null);
      setRoleSearchQuery("");
      setEditFieldValue("");
      setEditFeedback("");
      setRoleFullscreen(false);
    }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [editingCandidateId, editingField]);
  const [search, setSearch] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [areaMenuOpen, setAreaMenuOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(target)
      ) {
        setCountryMenuOpen(false);
      }

      if (areaDropdownRef.current && !areaDropdownRef.current.contains(target)) {
        setAreaMenuOpen(false);
      }

      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setRoleMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedAreaForRoles, setSelectedAreaForRoles] = useState<string | null>(null);
  const [expandedMiniDashboard, setExpandedMiniDashboard] = useState<"area" | "country" | null>(null);
  const [minAtsScore, setMinAtsScore] = useState("");
  const [maxAtsScore, setMaxAtsScore] = useState("");
  const [minYearsExperience, setMinYearsExperience] = useState("");
  const [maxYearsExperience, setMaxYearsExperience] = useState("");
  const [selectedInterviewStatus, setSelectedInterviewStatus] = useState("");
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
      setCandidates((data.candidates || []).map((c: any) => ({ ...c, linkCV: typeof c.linkCV === "string" ? c.linkCV.trim() : "",
      linkPortfolio: typeof c.linkPortfolio === "string" ? c.linkPortfolio.trim() : "",
      linkLinkedIn: typeof c.linkLinkedIn === "string" ? c.linkLinkedIn.trim() : "",
      videoURL: String(c.videoURL ?? c.videoUrl ?? c.rawFields?.["Video URL"] ?? c.rawFields?.["Video URL "] ?? c.rawFields?.["video_url"] ?? c.rawFields?.["videoUrl"] ?? "").trim(),
      transcriptURL: String(c.transcriptURL ?? c.transcriptUrl ?? c.rawFields?.["Transcript URL"] ?? c.rawFields?.["Transcript URL "] ?? c.rawFields?.["transcript_url"] ?? c.rawFields?.["transcriptUrl"] ?? "").trim(),
      availability: c.rawFields?.["Availability"] ?? "",
      workingHours: c.workingHours ?? c.rawFields?.["Working Hours"] ?? c.rawFields?.["working_hours"] ?? c.rawFields?.["workingHours"] ?? "",
      employeeType: c.employeeType ?? c.rawFields?.["Employee Type"] ?? c.rawFields?.["employee_type"] ?? c.rawFields?.["employeeType"] ?? "",
      relevantExperience: c.rawFields?.["Relevant Experience"] ?? "",
      yearsOfExperience: c.rawFields?.["Years of Experience"] ?? "",
      tools: c.rawFields?.["Tools"] ?? "",
      dateOfBirth: c.rawFields?.["Date of Birth"] ?? "",
      gender: c.rawFields?.["Gender"] ?? "",
      referralSource: c.rawFields?.["Where did you hear about this job opportunity?"] ?? "",
      region: c.rawFields?.["Region (SEA / Non SEA)"] ?? "",
      positionApplied: c.rawFields?.["Position Applied"] ?? "", date: normalizeCandidateDate(c.date),
      attachment: (() => {
        const value = c.attachment;

        if (Array.isArray(value)) return value;
        if (typeof value !== "string" || !value.trim()) return [];

        const raw = value.trim();
        const match = raw.match(/^(.*?)\s*\((https:\/\/[^)]+)\)\s*$/i);

        if (match) {
          try {
            const parsedUrl = new URL(match[2]);

            if (
              parsedUrl.protocol !== "https:" ||
              !parsedUrl.hostname.endsWith("airtableusercontent.com")
            ) {
              return [];
            }

            const filename = match[1].trim();

            return [{
              filename,
              url: parsedUrl.toString(),
              type: filename.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "",
            }];
          } catch {
            return [];
          }
        }

        return [{
          path: raw,
          filename: raw.split("/").pop() || "candidate-cv.pdf",
          type: "application/pdf",
        }];
      })(), score: c.atsScore ?? c.score ?? null, skillsMatchScore: c.skillMatchScore ?? c.skillsMatchScore ?? null, experienceMatch: c.experienceMatchScore ?? c.experienceMatch ?? null, strength: c.strengths ?? c.strength ?? "", gap: c.gaps ?? c.gap ?? "" })));
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
      !searchTerm ||
      String(candidate.name ?? "").toLowerCase().includes(searchTerm) ||
      String(candidate.email ?? "").toLowerCase().includes(searchTerm);

    const parsedCandidateDate = candidate.date
      ? new Date(candidate.date)
      : null;

    const candidateDate =
      parsedCandidateDate &&
      !Number.isNaN(parsedCandidateDate.getTime())
        ? parsedCandidateDate.toISOString().split("T")[0]
        : "";

    const matchesDate =
      !selectedDate || candidateDate === selectedDate;
    const candidateArea = String(
      candidate.rawFields?.["Area"] ??
      candidate.rawFields?.["area"] ??
      candidate.area ??
      ""
    ).trim();

    const standardAreas = [
      "Automations",
      "Operational Support",
      "Digital Content & Media",
      "Web Designer",
      "Recruitment",
      "Revenue/Sales",
      "Finance",
    ];

    const matchesArea =
      selectedAreas.length === 0 ||
      selectedAreas.some((area) =>
        area === "Other"
          ? !candidateArea ||
            !standardAreas.some((knownArea) =>
              knownArea.toLowerCase() === candidateArea.toLowerCase()
            )
          : candidateArea.toLowerCase() === area.toLowerCase()
      );

    const candidateRole = String(candidate.rawFields?.["Role"] ?? "").trim();

    const matchesRole =
      selectedRoles.length === 0 ||
      selectedRoles.some(
        (role) => candidateRole.toLowerCase() === role.toLowerCase()
      );

    const normalizeCountry = (value: unknown) =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const candidateCountry = String(
      candidate.country ??
      candidate.rawFields?.["Country"] ??
      candidate.rawFields?.["country"] ??
      ""
    ).trim();

    const matchesCountry =
      selectedCountries.length === 0 ||
      selectedCountries.some(
        (country) => normalizeCountry(candidateCountry) === normalizeCountry(country)
      );

    const score = candidate.score;
    const matchesMinScore =
      minAtsScore === "" ||
      (score !== null && score >= Number(minAtsScore));
    const matchesMaxScore =
      maxAtsScore === "" ||
      (score !== null && score <= Number(maxAtsScore));

    const normalizeInterviewStatus = (value: unknown) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const matchesInterviewStatus =
  !selectedInterviewStatus ||
  normalizeInterviewStatus(candidate.interviewStatus) ===
    normalizeInterviewStatus(selectedInterviewStatus);
    const yearsText = String(
      candidate.yearsOfExperience ??
      candidate.rawFields?.["Years of Experience"] ??
      candidate.rawFields?.["Relevant Experience"] ??
      ""
    ).trim().toLowerCase();

    const yearsMatch = yearsText.match(/\d+(?:\.\d+)?/);
    const yearsValue = yearsMatch ? Number(yearsMatch[0]) : NaN;
    const hasYearsValue = yearsText !== "" && Number.isFinite(yearsValue);

    const matchesMinYears =
      minYearsExperience === "" ||
      (hasYearsValue && yearsValue >= Number(minYearsExperience));

    const matchesMaxYears =
      maxYearsExperience === "" ||
      (hasYearsValue && yearsValue <= Number(maxYearsExperience));

    return matchesSearch && matchesDate && matchesArea && matchesRole && matchesCountry &&
      matchesMinScore && matchesMaxScore && matchesInterviewStatus &&
      matchesMinYears && matchesMaxYears;
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
  const currentPageIds = paginatedCandidates.map((candidate) => candidate.id);

  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedCandidateIds.includes(id));

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidateIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
  };

  const toggleCurrentPageSelection = () => {
    setSelectedCandidateIds((previous) => {
      if (allCurrentPageSelected) {
        return previous.filter((id) => !currentPageIds.includes(id));
      }
      return Array.from(new Set([...previous, ...currentPageIds]));
    });
  };

  const exportCandidatesToGoogleSheets = async (
    exportAllFiltered: boolean
  ) => {
    const selectedIds = new Set(selectedCandidateIds);

    const candidatesToExport = exportAllFiltered
      ? sortedCandidates
      : candidates.filter((candidate) => selectedIds.has(candidate.id));

    if (candidatesToExport.length === 0) {
      setExportError(
        exportAllFiltered
          ? "No candidates match the current filters."
          : "Select at least one candidate to export."
      );
      return;
    }

    setExporting(true);
    setExportError("");
    setSpreadsheetUrl("");

    try {
      const response = await fetch("/api/google/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `ATS Candidates Export ${new Date().toISOString().slice(0, 10)}`,
          candidates: candidatesToExport,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to export candidates to Google Sheets."
        );
      }

      setSpreadsheetUrl(result.spreadsheetUrl);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Unable to export candidates."
      );
    } finally {
      setExporting(false);
    }
  };

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  );
  const primaryColor = "#124559";

  const availableCountries = useMemo(() => {
    const values = candidates.map((candidate) =>
      String(
        candidate.country ??
        candidate.rawFields?.["Country"] ??
        candidate.rawFields?.["country"] ??
        ""
      ).trim()
    ).filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [candidates]);
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    candidates.forEach((candidate) => {
      const country = String(
        candidate.country ??
        candidate.rawFields?.["Country"] ??
        candidate.rawFields?.["country"] ??
        ""
      ).trim();

      if (!country) return;

      counts[country] = (counts[country] ?? 0) + 1;
    });

    return Object.entries(counts).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [candidates]);

  const areaCounts = useMemo(() => {
    const approvedAreas = [
      "Revenue/Sales",
      "Operational Support",
      "Digital Content & Media",
      "Web Designer",
      "Automations",
      "Recruitment",
      "Finance",
    ];

    return approvedAreas.map((area) => {
      const count = candidates.filter((candidate) => {
        const candidateArea = String(
          candidate.rawFields?.["Area"] ??
          candidate.rawFields?.["area"] ??
          candidate.area ??
          ""
        ).trim();

        return candidateArea.toLowerCase() === area.toLowerCase();
      }).length;

      return [area, count] as [string, number];
    });
  }, [candidates]);
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
        <div style={{...styles.statsRow, marginLeft: "-12px", marginBottom: "6px"}}>
          <div style={{...styles.statCard, borderColor: primaryColor + '20'}}>
            <div style={{...styles.statHeader, justifyContent: "center", paddingLeft: "12px"}}>
              <p style={styles.statLabel}>Total candidates</p>
              <span style={{...styles.statIcon, color: primaryColor}}></span>
            </div>
            <p style={{...styles.statValue, textAlign: "center", paddingLeft: "12px"}}>{stats.total}</p>
            <p style={{...styles.statDesc, textAlign: "center", paddingLeft: "12px"}}>All applications</p>
          </div>
        </div>
        <div
          style={expandedMiniDashboard === "area" ? {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
            boxSizing: "border-box",
            margin: 0,
            padding: "24px",
            border: "none",
            borderRadius: 0,
            background: "#FFFFFF",
            boxShadow: "none",
            overflow: "auto",
          } : {
            margin: "2px 4px 6px 18px",
            padding: "4px 0",
            border: "1px solid #cfe1e8",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.82)",
            boxShadow: "0 8px 22px rgba(18,69,89,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "0 12px", marginBottom: "5px" }}>
            <p style={{ margin: 0, color: "#124559", fontSize: expandedMiniDashboard === "area" ? "22px" : "15px", fontWeight: 700 }}>
              Candidates by Area / Role
            </p>
            <button
              type="button"
              onClick={() => setExpandedMiniDashboard(expandedMiniDashboard === "area" ? null : "area")}
              aria-label={expandedMiniDashboard === "area" ? "Close expanded area panel" : "Expand area panel"}
              title={expandedMiniDashboard === "area" ? "Close" : "Expand to full screen"}
              style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: "1px solid #DCE5EF", borderRadius: "7px", background: "#FFFFFF", color: "#124559", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}
            >
              {expandedMiniDashboard === "area" ? "✕" : "⛶"}
            </button>
          </div>

          <div style={{ maxHeight: expandedMiniDashboard === "area" ? "calc(100vh - 110px)" : "260px", overflowY: "auto", padding: expandedMiniDashboard === "area" ? "0 4px" : "0" }}>
            {areaCounts.map(([area, count]) => {
              const isSelected = selectedAreaForRoles === area;

              const roleCounts: [string, number][] = Object.entries(
                candidates.reduce<Record<string, number>>((counts, candidate) => {
                  const candidateArea = String(
                    candidate.rawFields?.["Area"] ??
                    candidate.rawFields?.["area"] ??
                    candidate.area ??
                    ""
                  ).trim();

                  if (candidateArea.toLowerCase() !== area.toLowerCase()) {
                    return counts;
                  }

                  const role = String(
                    candidate.rawFields?.["Role"] ??
                    ""
                  ).trim();

                  if (!role) return counts;

                  counts[role] = (counts[role] ?? 0) + 1;
                  return counts;
                }, {})
              ).sort(([a], [b]) => a.localeCompare(b));

              return (
                <div key={area}>
                  <button
                    type="button"
                    onClick={() => setSelectedAreaForRoles(isSelected ? null : area)}
                    aria-expanded={isSelected}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      width: "100%",
                      padding: "11px 10px",
                      border: "none",
                      borderBottom: "1px solid #D8E8F0",
                      borderLeft: isSelected ? "4px solid #124559" : "4px solid #B8D5E2",
                      borderRadius: "4px",
                      background: isSelected ? "#E5F2F8" : "#F4F9FC",
                      color: "#124559",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ flex: 1 }}>{area}</span>
                    <span style={{ color: "#124559", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {count}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </button>

                  {isSelected && (
                    <div style={{ marginLeft: "14px", padding: "6px 10px 8px 12px", background: "#FFFFFF", borderLeft: "2px solid #DCE5EF", borderBottom: "1px solid #E8EEF2", borderRadius: "0 0 6px 6px" }}>
                      {roleCounts.length === 0 ? (
                        <p style={{ margin: "6px 0", color: "#8296B1", fontSize: "12px" }}>
                          No roles found for this area.
                        </p>
                      ) : (
                        roleCounts.map(([role, roleCount]) => (
                          <div
                            key={role}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "8px",
                              padding: "7px 0",
                              borderBottom: "1px solid #edf2f5",
                              fontSize: "12px",
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ flex: 1, color: "#475569" }}>{role}</span>
                            <span style={{ color: "#124559", fontWeight: 700 }}>{roleCount}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={expandedMiniDashboard === "country" ? {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            width: "100vw",
            height: "100vh",
            boxSizing: "border-box",
            margin: 0,
            padding: "24px",
            border: "none",
            borderRadius: 0,
            background: "#FFFFFF",
            overflow: "auto",
          } : {
            margin: "12px 12px 8px 18px",
            padding: "12px",
            border: "1px solid #DCE5EF",
            borderRadius: "10px",
            background: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
            <p style={{ margin: 0, color: "#124559", fontSize: expandedMiniDashboard === "country" ? "22px" : "13px", fontWeight: 700 }}>
              Candidates by Country
            </p>
            <button
              type="button"
              onClick={() => setExpandedMiniDashboard(expandedMiniDashboard === "country" ? null : "country")}
              aria-label={expandedMiniDashboard === "country" ? "Close expanded country panel" : "Expand country panel"}
              title={expandedMiniDashboard === "country" ? "Close" : "Expand to full screen"}
              style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: "1px solid #DCE5EF", borderRadius: "7px", background: "#FFFFFF", color: "#124559", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}
            >
              {expandedMiniDashboard === "country" ? "✕" : "⛶"}
            </button>
          </div>

          <div style={{ maxHeight: expandedMiniDashboard === "country" ? "calc(100vh - 110px)" : "260px", overflowY: "auto", padding: expandedMiniDashboard === "country" ? "0 4px" : "0" }}>
            {countryCounts.length === 0 ? (
              <p style={{ margin: 0, color: "#8296B1", fontSize: "12px" }}>
                No country data available
              </p>
            ) : (
              countryCounts.map(([country, count]) => (
                <div
                  key={country}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "7px 0",
                    borderBottom: "1px solid #F1F5F9",
                  }}
                >
                  <span
                    style={{
                      color: "#334155",
                      fontSize: "12px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {country}
                  </span>
                  <span
                    style={{
                      color: "#124559",
                      fontSize: "13px",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))
            )}
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
            <span style={styles.sidebarGuideText}><strong>65-84</strong> Good Match</span>
          </div>
          <div style={styles.sidebarGuideItem}>
            <span style={{...styles.sidebarDot, backgroundColor: '#f59e0b'}}></span>
            <span style={styles.sidebarGuideText}><strong>50-64</strong> Moderate Match</span>
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
        <div
  role="alert"
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 20px",
    backgroundColor: "#FEF2F2",
    borderBottom: "1px solid #FCA5A5",
    color: "#991B1B",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "13px",
    lineHeight: 1.5,
  }}
>
  <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
  <div>
    <strong style={{ display: "block", marginBottom: "2px" }}>
      System Maintenance Notice
    </strong>
    The dashboard is currently undergoing maintenance. Some features
    may be temporarily unavailable or may not function as expected.
    We apologize for the inconvenience and appreciate your patience.
  </div>
</div>
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
                flexWrap: 'nowrap',
                padding: '18px 20px',
              }}
            >
              

              
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
                    border: '1px solid #DCE5EF',
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
                      ×
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
                    border: '1px solid #DCE5EF',
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
                    &#8249;
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
                    &#8250;
                  </button>
                
                
</div>



{/* ATS Score Filters */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    gap: "6px",
    width: "100%",
    margin: "8px 0",
    padding: "4px 0",
    boxSizing: "border-box",
    }}
>


  <div ref={countryDropdownRef} style={{ position: "relative" }}>
    <button
      type="button"
      onClick={() => setCountryMenuOpen((open) => !open)}
      aria-label="Filter by country"
      aria-expanded={countryMenuOpen}
      style={{
        width: "145px",
        height: "38px",
        boxSizing: "border-box",
        padding: "0 10px",
        border: "1px solid #DCE5EF",
        borderRadius: "8px",
        background: "#fff",
        color: "#334155",
        fontSize: "13px",
        cursor: "pointer",
        textAlign: "left"
      }}
    >
      {selectedCountries.length === 0
        ? "Filter by country"
        : `${selectedCountries.length} Countries`} ▾
    </button>

    {countryMenuOpen && (
      <div style={{
        position: "absolute",
        top: "42px",
        left: 0,
        zIndex: 100,
        width: "230px",
        maxHeight: "300px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #DCE5EF",
        borderRadius: "8px",
        padding: "8px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.12)"
      }}>
        {availableCountries.length === 0 ? (
          <div style={{ padding: "8px", fontSize: "13px", color: "#64748b" }}>
            No countries available
          </div>
        ) : availableCountries.map((country) => (
          <label key={country} style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 4px",
            fontSize: "13px",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={selectedCountries.includes(country)}
              onChange={() => {
                setSelectedCountries((previous) =>
                  previous.includes(country)
                    ? previous.filter((item) => item !== country)
                    : [...previous, country]
                );
                setCurrentPage(1);
              }}
            />
            {country}
          </label>
        ))}

        <button
          type="button"
          onClick={() => {
            setSelectedCountries([]);
            setCurrentPage(1);
          }}
          style={{
            marginTop: "6px",
            padding: "6px",
            width: "100%",
            border: "1px solid #DCE5EF",
            borderRadius: "6px",
            background: "#F8FAFC",
            cursor: "pointer"
          }}
        >
          Clear countries
        </button>
      </div>
    )}
  </div>

  <div ref={areaDropdownRef} style={{ position: "relative" }}>
    <button type="button"
      onClick={() => { setAreaMenuOpen(!areaMenuOpen); setRoleMenuOpen(false); }}
      style={{ width: "165px", height: "38px", padding: "0 10px", border: "1px solid #DCE5EF", borderRadius: "8px", background: "#fff", color: "#334155", fontSize: "13px", cursor: "pointer", textAlign: "left" }}>
      {selectedAreas.length === 0 ? "All Areas" : `${selectedAreas.length} Areas Selected`} ▾
    </button>
    {areaMenuOpen && <div style={{ position: "absolute", top: "42px", left: 0, zIndex: 50, width: "220px", maxHeight: "300px", overflowY: "auto", background: "#fff", border: "1px solid #DCE5EF", borderRadius: "8px", padding: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}>
      {["Other", "Automations", "Operational Support", "Digital Content & Media", "Web Designer", "Recruitment", "Revenue/Sales", "Finance"].map((area) => (
        <label key={area} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 4px", fontSize: "13px", cursor: "pointer" }}>
          <input type="checkbox" checked={selectedAreas.includes(area)}
            onChange={() => {
              setSelectedAreas((prev) => prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]);
              setSelectedRoles([]);
              setCurrentPage(1);
            }} />
          {area}
        </label>
      ))}
      <button type="button" onClick={() => { setSelectedAreas([]); setSelectedRoles([]); setCurrentPage(1); }}
        style={{ marginTop: "6px", padding: "6px", width: "100%", border: "1px solid #DCE5EF", borderRadius: "6px", background: "#F8FAFC", cursor: "pointer" }}>
        Clear areas
      </button>
    </div>}
  </div>

  <div ref={roleDropdownRef} style={{ position: "relative" }}>
    <button type="button"
      onClick={() => { setRoleMenuOpen(!roleMenuOpen); setAreaMenuOpen(false); }}
      style={{ minWidth: "175px", maxWidth: "240px", height: "38px", padding: "0 10px", border: "1px solid #DCE5EF", borderRadius: "8px", background: "#fff", color: "#334155", fontSize: "13px", cursor: "pointer", textAlign: "left" }}>
      {selectedRoles.length === 0 ? (selectedAreas.length === 1 ? `All ${selectedAreas[0]} Roles` : "All Roles") : `${selectedRoles.length} Roles Selected`} ▾
    </button>
    {roleMenuOpen && <div style={{ position: "absolute", top: "42px", left: 0, zIndex: 50, width: "280px", maxHeight: "350px", overflowY: "auto", background: "#fff", border: "1px solid #DCE5EF", borderRadius: "8px", padding: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}>
      {[
        { area: "Revenue/Sales", roles: ["Appointment Setter", "Cold Caller", "Lead Researcher", "Apollo Researcher", "LinkedIn Researcher", "CRM Data Assistant", "Sales Assistant", "Sales Development Representative (SDR)", "Business Development Representative (BDR)"] },
        { area: "Operational Support", roles: ["Executive Assistant", "Operations Assistant", "Customer Support Assistant", "Customer Success Assistant", "Admin Assistant", "Project Coordinator"] },
        { area: "Digital Content & Media", roles: ["Social Media Manager", "Content Creator", "Video Editor", "Short-form Video Editor", "Graphic Designer", "Canva Designer", "Copywriter", "Newsletter Assistant", "AI Content Operator"] },
        { area: "Web Designer", roles: ["Web Designer", "Landing Page Builder", "WordPress Assistant", "Elementor Builder", "Framer Builder", "Website Maintenance Assistant", "Web QA Assistant", "Local SEO Assistant", "Webflow Assistant"] },
        { area: "Automations", roles: ["Clay Operator", "Apollo + Smartlead", "OperatorGoHigh", "Level AssistantHub", "Spot Assistant", "CRM Assistant", "Make.com Assistant", "n8n Automation Assistant", "Zapier Assistant", "AI Automation Assistant", "Prompt / AI Workflow Assistant"] },
        { area: "Recruitment", roles: ["Talent Sourcer", "Recruiter", "Candidate Screener", "Recruitment Coordinator", "HR Assistant", "LinkedIn Sourcing Assistant", "Candidate Database Assistant"] },
        { area: "Finance", roles: ["Bookkeeper", "Finance Admin Assistant", "Accounts Payable Assistant", "Accounts Receivable Assistant", "Payroll Assistant", "Xero Assistant", "QuickBooks Assistant", "Reporting Assistant"] }
      ].filter((bucket) => selectedAreas.length === 0 || selectedAreas.includes(bucket.area))
       .flatMap((bucket) => bucket.roles)
       .filter((role, index, roles) => roles.indexOf(role) === index)
       .map((role) => (
         <label key={role} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 4px", fontSize: "13px", cursor: "pointer" }}>
           <input type="checkbox" checked={selectedRoles.includes(role)}
             onChange={() => {
               setSelectedRoles((prev) => prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]);
               setCurrentPage(1);
             }} />
           {role}
         </label>
       ))}
      <button type="button" onClick={() => { setSelectedRoles([]); setCurrentPage(1); }}
        style={{ marginTop: "6px", padding: "6px", width: "100%", border: "1px solid #DCE5EF", borderRadius: "6px", background: "#F8FAFC", cursor: "pointer" }}>
        Clear roles
      </button>
    </div>}
  </div>

  <input
    type="number"
    min="0"
    max="100"
    placeholder="Min ATS"
    aria-label="Minimum ATS score"
    value={minAtsScore}
    onChange={(e) => {
      setMinAtsScore(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      width: "88px",
      height: "38px",
      boxSizing: "border-box",
      padding: "0 10px",
      border: "1px solid #DCE5EF",
      borderRadius: "8px",
      outline: "none",
      backgroundColor: "#ffffff",
      color: "#0f172a",
      fontSize: "13px",
    }}
  />

  <input
    type="number"
    min="0"
    max="100"
    placeholder="Max ATS"
    aria-label="Maximum ATS score"
    value={maxAtsScore}
    onChange={(e) => {
      setMaxAtsScore(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      width: "88px",
      height: "38px",
      boxSizing: "border-box",
      padding: "0 10px",
      border: "1px solid #DCE5EF",
      borderRadius: "8px",
      outline: "none",
      backgroundColor: "#ffffff",
      color: "#0f172a",
      fontSize: "13px",
    }}
  />

  <select
    aria-label="Filter by interview status"
    value={selectedInterviewStatus}
    onChange={(e) => {
      setSelectedInterviewStatus(e.target.value);
      setCurrentPage(1);
    }}
    style={{
      width: "155px",
      height: "38px",
      boxSizing: "border-box",
      padding: "0 10px",
      border: "1px solid #DCE5EF",
      borderRadius: "8px",
      outline: "none",
      backgroundColor: "#ffffff",
      color: "#334155",
      fontSize: "13px",
      cursor: "pointer",
    }}
  >
    <option value="">All Status</option>
    <option value="Invitation Send">Invitation Send</option>
    <option value="Interview Done">Interview Done</option>
  </select>


  <input
    type="number"
    min="0"
    placeholder="Min Years"
    aria-label="Minimum years of experience"
    value={minYearsExperience}
    onChange={(e) => {
      setMinYearsExperience(e.target.value);
      setCurrentPage(1);
    }}
    style={{ width: "88px", height: "38px", boxSizing: "border-box", padding: "0 9px", border: "1px solid #DCE5EF", borderRadius: "8px", fontSize: "13px", color: "#334155" }}
  />
  <input
    type="number"
    min="0"
    placeholder="Max Years"
    aria-label="Maximum years of experience"
    value={maxYearsExperience}
    onChange={(e) => {
      setMaxYearsExperience(e.target.value);
      setCurrentPage(1);
    }}
    style={{ width: "88px", height: "38px", boxSizing: "border-box", padding: "0 9px", border: "1px solid #DCE5EF", borderRadius: "8px", fontSize: "13px", color: "#334155" }}
  />
  <button
    type="button"
    onClick={() => {
      setMinAtsScore("");
      setMaxAtsScore("");
      setMinYearsExperience("");
      setMaxYearsExperience("");
      setSelectedInterviewStatus("");
      setSelectedAreas([]);
      setSelectedRoles([]);
      setSelectedCountries([]);
      setCurrentPage(1);
    }}
    style={{
      height: "38px",
      padding: "0 12px",
      border: "1px solid #124559",
      borderRadius: "8px",
      backgroundColor: "#124559",
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    Clear Filters
  </button>
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
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "13px", color: "#475569", marginLeft: "8px" }}>
                    {selectedCandidateIds.length} selected
                  </span>
                  {selectedCandidateIds.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        const selectedCandidates = candidates.filter((candidate) =>
                          selectedCandidateIds.includes(candidate.id)
                        );

                        if (selectedCandidates.length === 0) {
                          alert("Please select at least one candidate.");
                          return;
                        }

                        const confirmed = window.confirm(
                          `Click OK to delete ${selectedCandidates.length} selected candidate(s) and refresh the recruiter dashboard?`
                        );

                        if (!confirmed) return;

                        try {
                          const response = await fetch(
                            "https://n8n.domingogarcia.info/webhook/3447e309-39d5-437b-a296-171225b5e62f",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json"
                              },
                              body: JSON.stringify({
                                action: "delete_selected",
                                source: "ATS Dashboard",
                                timestamp: new Date().toISOString(),
                                candidateIds: selectedCandidates.map((candidate) => candidate.id),
                                candidates: selectedCandidates.map((candidate) => ({
                                  id: candidate.id,
                                  name: candidate.name,
                                  email: candidate.email,
                                  area: candidate.area
                                }))
                              })
                            }
                          );

                          if (!response.ok) {
                            throw new Error(`Webhook returned HTTP ${response.status}`);
                          }

                          setSelectedCandidateIds([]);
                          
                        } catch (error) {
                          console.error("Delete webhook failed:", error);
                          alert(
                            "Could not confirm the webhook request. Check the browser console and n8n execution history."
                          );
                        }
                      }}
                      style={{
                        height: "38px",
                        padding: "0 14px",
                        border: "1px solid #dc2626",
                        borderRadius: "8px",
                        background: "#dc2626",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600
                      }}
                    >
                      Delete Selected ({selectedCandidateIds.length})
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() => exportCandidatesToGoogleSheets(false)}
                    style={{ height: "38px", padding: "0 14px", border: "none", borderRadius: "8px", background: "#124559", color: "#ffffff", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.65 : 1, fontSize: "13px", fontWeight: 600 }}
                  >
                    {exporting ? "Exporting..." : "Export Selected"}
                  </button>
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() => exportCandidatesToGoogleSheets(true)}
                    style={{ height: "38px", padding: "0 14px", border: "1px solid #124559", borderRadius: "8px", background: "#ffffff", color: "#124559", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.65 : 1, fontSize: "13px", fontWeight: 600 }}
                  >
                    Export All Filtered ({sortedCandidates.length})
                  </button>
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "13px", color: "#124559", fontWeight: 600, textDecoration: "underline" }}
                    >
                      Open Google Sheet
                    </a>
                  )}
                  {exportError && (
                    <span role="alert" style={{ width: "100%", fontSize: "13px", color: "#b91c1c" }}>
                      {exportError}
                    </span>
                  )}
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr style={{...styles.trHeader, borderColor: primaryColor + '15'}}>
                      <th style={{...styles.th, width: "42px"}}>
                        <input
                          type="checkbox"
                          aria-label="Select all candidates on this page"
                          checked={allCurrentPageSelected}
                          onChange={toggleCurrentPageSelection}
                        />
                      </th>
                      <th style={{...styles.th, width: '20%'}}>Candidate</th>
                      <th style={{...styles.th, width: '12%'}}>Date</th>
                      <th style={{...styles.th, width: '16%'}}><strong>Area / Role</strong></th>
                      
                      <th style={{...styles.th, width: '15%'}}>AI Summary</th>
                      <th style={{...styles.th, width: '16%'}}>Interview Status</th>
                      <th style={{...styles.thAction, width: '15%'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map((candidate) => (
                      <tr key={candidate.id} style={styles.tr}>
                        <td style={{...styles.td, width: "42px"}}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${candidate.name || candidate.email || candidate.id}`}
                            checked={selectedCandidateIds.includes(candidate.id)}
                            onChange={() => toggleCandidateSelection(candidate.id)}
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={styles.candidateInfo}>
                            <div style={{...styles.avatar, background: primaryColor + '15', color: primaryColor}}>
                              {getInitials(candidate.name)}
                            </div>
                            <div>
                              <p style={styles.candidateName}>{candidate.name || "Unnamed"}</p>
                              <p style={styles.candidateEmail}>{candidate.email || "No email"}</p>
                              <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0" }}>
                                Country: {candidate.country || "Not provided"} · Salary expectation: {String(candidate.salaryExpectation ?? candidate.rawFields?.["Salary Expectation (with Currency)"] ?? candidate.rawFields?.["Salary Expectation"] ?? candidate.rawFields?.salaryExpectation ?? "").trim() || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{...styles.td, whiteSpace: 'nowrap'}}><div>
  <div>{formatDate(candidate.date)}</div>
  <div style={{ fontSize: "14px",
          fontWeight: 600,
          color: "#475569",
          marginTop: "4px" }}>
    {formatTime(candidate.date)}
  </div>
</div></td>
                        <td style={styles.td}>
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px", width: "100%" }}>
    {(["Area", "Role"] as const).map((field) => {
      const currentValue = String(
        field === "Area"
          ? (candidate.rawFields?.["Area"] ?? candidate.rawFields?.["area"] ?? candidate.area ?? "")
          : (candidate.rawFields?.["Role"] ?? candidate.rawFields?.["role"] ?? candidate.role ?? "")
      ).trim();

      const options = field === "Role"
        ? ["Appointment Setter","Cold Caller","Lead Researcher","Apollo Researcher","LinkedIn Researcher","CRM Data Assistant","Sales Assistant","Sales Development Representative (SDR)","Business Development Representative (BDR)","Executive Assistant","Operations Assistant","Customer Support Assistant","Customer Success Assistant","Admin Assistant","Project Coordinator","Social Media Manager","Content Creator","Video Editor","Short-form Video Editor","Graphic Designer","Canva Designer","Copywriter","Newsletter Assistant","AI Content Operator","Web Designer","Landing Page Builder","WordPress Assistant","Elementor Builder","Framer Builder","Website Maintenance Assistant","Web QA Assistant","Local SEO Assistant","Webflow Assistant","Clay Operator","Apollo + Smartlead Operator","GoHighLevel Assistant","HubSpot Assistant","CRM Assistant","Make.com Assistant","n8n Automation Assistant","Zapier Assistant","AI Automation Assistant","Prompt / AI Workflow Assistant","Talent Sourcer","Recruiter","Candidate Screener","Recruitment Coordinator","HR Assistant","LinkedIn Sourcing Assistant","Candidate Database Assistant","Bookkeeper","Finance Admin Assistant","Accounts Payable Assistant","Accounts Receivable Assistant","Payroll Assistant","Xero Assistant","QuickBooks Assistant","Reporting Assistant"]
        : Array.from(new Set(
            candidates.map((item) =>
              String(item.rawFields?.["Area"] ?? item.rawFields?.["area"] ?? item.area ?? "").trim()
            ).filter(Boolean)
          )).sort((a, b) => a.localeCompare(b));

      if (currentValue && !options.includes(currentValue)) options.unshift(currentValue);

      const isEditing =
        editingCandidateId === String(candidate.id) && editingField === field;

      return (
        <div key={field} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", maxWidth: "100%" }}>
            <span style={{
              display: "inline-block",
              padding: "5px 9px",
              borderRadius: "6px",
              background: field === "Area" ? "#E0F2F1" : "#F1EAFE",
              border: field === "Area" ? "1px solid #99D5CE" : "1px solid #D6C4F5",
              color: field === "Area" ? "#115E59" : "#6B3FA0",
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1.4,
              overflowWrap: "anywhere"
            }}>
              <span style={{ fontWeight: 700 }}>{field}:</span>{" "}
              {currentValue || (field === "Area" ? "Other" : "Role not provided")}
            </span>

            <button
              type="button"
              title={`Edit ${field}`}
              aria-label={`Edit ${field}`}
              onClick={(event) => {
                                editAnchorRef.current = event.currentTarget;
                const rect = event.currentTarget.getBoundingClientRect();
                const panelHeight = Math.min(field === "Role" ? 440 : 240, window.innerHeight - 16);
                const top = Math.max(8, rect.top - 6 - (editMenuRef.current?.getBoundingClientRect().height ?? panelHeight));
                const left = Math.max(8, Math.min(rect.left, window.innerWidth - 296));
                setEditMenuPosition({ top, left });
                setEditingCandidateId(String(candidate.id));
                setEditingField(field);
                setRoleSearchQuery('');
                setRoleDropdownOpen(false);
                setEditFieldValue(currentValue);
                setEditFeedback("");
              }}
              style={{
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                background: "#FFFFFF",
                color: "#374151",
                cursor: "pointer",
                width: "28px",
                height: "28px",
                flexShrink: 0,
                fontSize: "18px"
              }}
            >
              ⋮
            </button>
          </div>

          {isEditing && typeof document !== "undefined" && createPortal(
            <div ref={editMenuRef} data-area-role-edit-menu="true" onClick={(event) => event.stopPropagation()} style={roleFullscreen && field === "Role" ? { position: "fixed", inset: 0, zIndex: 10000, display: "flex", flexDirection: "column", gap: "12px", width: "100vw", height: "100dvh", maxWidth: "none", boxSizing: "border-box", overflowY: "auto", padding: "24px", background: "#FFFFFF", border: "none", borderRadius: 0, boxShadow: "none" } : { position: "fixed", top: editMenuPosition.top, left: editMenuPosition.left, zIndex: 10000, display: "flex", flexDirection: "column", gap: "8px", width: "min(280px, calc(100vw - 16px))", maxHeight: `calc(100dvh - ${editMenuPosition.top + 8}px)`, overflowY: "auto", overscrollBehavior: "contain", boxSizing: "border-box", padding: "12px", background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <label style={{ fontSize: "12px", fontWeight: 600 }}>
                Select {field}
              </label>
              {field === "Role" ? (
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    value={roleSearchQuery}
                    onChange={(event) => {
                      setRoleSearchQuery(event.target.value);
                      setRoleDropdownOpen(true);
                    }}
                    onFocus={() => setRoleDropdownOpen(true)}
                    placeholder={editFieldValue || "Search or select a role..."}
                    aria-label="Search and select a role"
                    disabled={editSubmitting}
                    style={{
                      width: "100%",
                      minWidth: 0,
                      padding: "10px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      background: "#FFFFFF",
                      color: "#111827",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />

                  {roleDropdownOpen && (
                    <div data-role-dropdown-options="true" style={roleFullscreen ? { position: "relative", width: "100%", maxWidth: "100%", maxHeight: "none", overflowY: "visible", overscrollBehavior: "contain", zIndex: 10001, background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", boxShadow: "none" } : { position: "relative", width: "100%", maxWidth: "100%", maxHeight: "min(40dvh, 300px)", overflowY: "auto", overscrollBehavior: "contain", zIndex: 1, background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", boxShadow: "none" }}>
                      {options.filter((option) =>
                        option.toLowerCase().includes(roleSearchQuery.trim().toLowerCase())
                      ).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setEditFieldValue(option);
                            setRoleSearchQuery("");
                            setRoleDropdownOpen(false);
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = "#1D4ED8";
                            event.currentTarget.style.color = "#FFFFFF";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = editFieldValue === option ? "#1D4ED8" : "#FFFFFF";
                            event.currentTarget.style.color = editFieldValue === option ? "#FFFFFF" : "#111827";
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "9px 12px",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid #F3F4F6",
                            background: editFieldValue === option ? "#1D4ED8" : "#FFFFFF",
                            color: "#111827",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          {option}
                        </button>
                      ))}

                      {options.filter((option) =>
                        option.toLowerCase().includes(roleSearchQuery.trim().toLowerCase())
                      ).length === 0 && (
                        <div style={{ padding: "10px 12px", color: "#6B7280", fontSize: "12px" }}>
                          No matching roles found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <select
                  value={editFieldValue}
                  onChange={(event) => setEditFieldValue(event.target.value)}
                  disabled={editSubmitting}
                  style={{ width: "100%", minWidth: 0, padding: "9px", border: "1px solid #D1D5DB", borderRadius: "6px", background: "#FFFFFF", color: "#111827", fontSize: "13px" }}
                >
                  {!editFieldValue && <option value="">Choose {field}</option>}
                  {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={editSubmitting || !editFieldValue.trim() || editFieldValue === currentValue}
                  onClick={async () => {
                    if (!editFieldValue.trim() || editSubmitting) return;

                    const oldValue = currentValue;
                    const newValue = editFieldValue.trim();
                    setEditSubmitting(true);
                    setEditFeedback("");

                    try {
                      const response = await fetch(
                        "https://n8n.domingogarcia.info/webhook/b4da5467-21f2-453c-975a-17fea31ff277",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            candidateId: String(candidate.id),
                            candidateName: candidate.name,
                            candidateEmail: candidate.email,
                            field,
                            oldValue,
                            newValue,
                            submittedAt: new Date().toISOString()
                          })
                        }
                      );

                      if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);

                      setCandidates((previous) => previous.map((item) =>
                        String(item.id) === String(candidate.id)
                          ? {
                              ...item,
                              ...(field === "Area" ? { area: newValue } : { role: newValue }),
                              rawFields: { ...(item.rawFields ?? {}), [field]: newValue }
                            }
                          : item
                      ));

                      setEditFeedback(`${field} submitted successfully.`);
                      setEditingCandidateId(null);
                      setEditingField(null);
                      setRoleSearchQuery('');
                      setEditFieldValue("");
                    } catch (error) {
                      console.error(`Failed to submit ${field} change:`, error);
                      setEditFeedback(error instanceof Error ? `Submission failed: ${error.message}` : "Submission failed. Please try again.");
                    } finally {
                      setEditSubmitting(false);
                    }
                  }}
                  style={{ flex: 1, padding: "8px 10px", border: "none", borderRadius: "6px", background: "#2563EB", color: "#FFFFFF", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  {editSubmitting ? "Submitting..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  disabled={editSubmitting}
                  onClick={() => {
                    setEditingCandidateId(null);
                    setEditingField(null);
                      setRoleSearchQuery('');
                    setEditFieldValue("");
                    setEditFeedback("");
                  }}
                  style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: "6px", background: "#FFFFFF", color: "#374151", cursor: "pointer", fontSize: "12px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          , document.body
          )}
        </div>
      );
    })}
    {editFeedback && editingCandidateId === String(candidate.id) && (
      <span style={{ fontSize: "12px", color: "#B91C1C" }}>{editFeedback}</span>
    )}
  </div>
</td>
                        <td style={styles.td}>
                          <button onClick={() => { setSelected(candidate); setReportComment(String(candidate.rawFields?.["Comments"] ?? "")); setCommentEditMode(false); setCommentFeedback(""); }} style={{...styles.viewBtn, background: primaryColor}}>
                            View report
                          </button>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusStyle(candidate.interviewStatus).backgroundColor,
                            color: getStatusStyle(candidate.interviewStatus).color,
                            border: getStatusStyle(candidate.interviewStatus).border, marginLeft: candidate.interviewStatus ? "0px" : "24px",
                          }}>
                            {candidate.interviewStatus || "-"}
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
    {candidate.interviewStatus === "Interview Done" ? "Interview Done" : candidate.interviewStatus === "Invitation Done" ? "Invitation Done" : "Invitation Sent"}
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
                ×
              </button>
            </div>

            <div style={styles.modalBody}>

              {/* Top Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                

                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid #DCE5EF',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={styles.modalStatLabel}><strong>Recommendation</strong></p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {selected.recommendation?.replace(/[Ã¢â‚¬Â"Ã¢â‚¬Å“]/g, "").trim() || "-"}
                  </p>
                </div>
              </div>



              {/* Candidate Details from Airtable */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ padding: "14px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "5px" }}>YEARS OF EXPERIENCE</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#124559" }}>
                    {String(selected.yearsOfExperience ?? selected.rawFields?.["Years of Experience"] ?? "").trim().replace(/\.0+$/, "") || "—"}
                  </div>
                </div>
              </div>
              {/* Summary */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #DCE5EF',
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
                  {selected.summary?.replace(/[Ã¢â‚¬Â"Ã¢â‚¬Å“]/g, "").trim() || "-"}
                </p>
              </div>

              {/* Strengths */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #DCE5EF',
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
                          âœ“
                        </span>

                        <span>{item}</span>
                      </div>
                    ))}

                  {!selected.strength && (
                    <p style={styles.reportText}>
                      -
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
                  border: '1px solid #DCE5EF',
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
                          ! 
                        </span>

                        <span>{item}</span>
                      </div>
                    ))}

                  {!selected.gap && (
                    <p style={styles.reportText}>
                      -
                    </p>
                  )}
                </div>
              </div>
              {/* Professional Links */}
              {[
                { label: "LinkedIn", value: selected.linkLinkedIn },
                { label: "CV Link", value: selected.linkCV },
                { label: "Portfolio", value: selected.linkPortfolio },
                { label: "Video URL", value: selected.videoURL },
                { label: "Transcript URL", value: selected.transcriptURL },
              ].some((item) => {
                const value = String(item.value ?? "").trim();
                return /^https?:\/\//i.test(value) &&
                  !/^(null|undefined|-|n\/a)$/i.test(value);
              }) && (
                <div
                  style={{
                    marginBottom: "18px",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "1px solid #DCE5EF",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <h3 style={styles.reportSectionTitle}>Professional Links</h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "12px",
                      marginTop: "14px",
                    }}
                  >
                    {[
                      { label: "LinkedIn", value: selected.linkLinkedIn },
                      { label: "CV Link", value: selected.linkCV },
                      { label: "Portfolio", value: selected.linkPortfolio },
                      { label: "Video URL", value: selected.videoURL },
                      { label: "Transcript URL", value: selected.transcriptURL },
                    ].map((item) => {
                      const url = String(item.value ?? "").trim();
                      const valid = /^https?:\/\//i.test(url) &&
                        !/^(null|undefined|-|n\/a)$/i.test(url);

                      return (
                        <div
                          key={item.label}
                          style={{
                            minWidth: 0,
                            padding: "12px",
                            border: "1px solid #DCE5EF",
                            borderRadius: "10px",
                            backgroundColor: "#F8FAFC",
                          }}
                        >
                          <div
                            style={{
                              color: "#8296B1",
                              fontSize: "12px",
                              fontWeight: 700,
                              marginBottom: "9px",
                            }}
                          >
                            {item.label}
                          </div>
                          {valid ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "9px 10px",
                                borderRadius: "7px",
                                backgroundColor: "#124559",
                                color: "#ffffff",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: 700,
                                textAlign: "center",
                              }}
                            >
                              Open {item.label}
                            </a>
                          ) : (
                            <div
                              style={{
                                color: "#8296B1",
                                fontSize: "13px",
                              }}
                            >
                              Not provided
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {[
                { label: "Availability", value: selected.availability },
                { label: "Working Hours", value: selected.workingHours },
                { label: "Employee Type", value: selected.employeeType },
                      { label: "Position Applied (Submitted in Application Form)", value: selected.positionApplied },
                      { label: "Region (SEA / Non SEA)", value: selected.region },
                { label: "Relevant Experience", value: selected.relevantExperience },
                { label: "Tools", value: selected.tools },
                { label: "Date of Birth", value: selected.dateOfBirth },
                { label: "Gender", value: selected.gender },
                { label: "Where did you hear about this job opportunity?", value: selected.referralSource },
              ].some((item) => {
                const value = String(item.value ?? "").trim();
                return value !== "" && !/^(null|undefined|-|n\/a)$/i.test(value);
              }) && (
                <div
                  style={{
                    marginBottom: "18px",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <h3 style={styles.reportSectionTitle}>
                    Additional Candidate Details
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "14px" }}>
                    {[
                      { label: "Availability", value: selected.availability },
                      { label: "Working Hours", value: selected.workingHours },
                      { label: "Employee Type", value: selected.employeeType },
                      { label: "Position Applied (Submitted in Application Form)", value: selected.positionApplied },
                      { label: "Region (SEA / Non SEA)", value: selected.region },
                { label: "Relevant Experience", value: selected.relevantExperience },
                { label: "Tools", value: selected.tools },
                { label: "Date of Birth", value: selected.dateOfBirth },
                { label: "Gender", value: selected.gender },
                { label: "Where did you hear about this job opportunity?", value: selected.referralSource },
                    ].map((item) => {
                      const value = String(item.value ?? "").trim();
                      if (!value || /^(null|undefined|-|n\/a)$/i.test(value)) return null;

                      return (
                        <div key={item.label}>
                          <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "6px" }}>
                            {item.label}
                          </div>
                          <div style={{ color: "#0f172a", fontSize: "14px", fontWeight: 600, overflowWrap: "anywhere" }}>
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Candidate Comments */}
              <div
                style={{
                  marginBottom: "18px",
                  padding: "18px",
                  borderRadius: "12px",
                  border: "1px solid #DCE5EF",
                  backgroundColor: "#ffffff",
                }}
              >
                <h3 style={styles.reportSectionTitle}>Candidate Comments</h3>
                <textarea
                  value={reportComment}
                  readOnly={!commentEditMode && Boolean(String(selected?.rawFields?.["Comments"] ?? "").trim())}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder="Write a comment about this candidate..."
                  rows={4}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: "12px",
                    padding: "12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    resize: "vertical",
                    font: "inherit",
                    color: "#0f172a",
                    backgroundColor:
                      !commentEditMode && Boolean(String(selected?.rawFields?.["Comments"] ?? "").trim())
                        ? "#f8fafc"
                        : "#ffffff",
                    cursor:
                      !commentEditMode && Boolean(String(selected?.rawFields?.["Comments"] ?? "").trim())
                        ? "default"
                        : "text",
                  }}
                />
                {commentFeedback && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: commentFeedback.startsWith("Error") ? "#dc2626" : "#15803d",
                    }}
                  >
                    {commentFeedback}
                  </p>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  {String(selected?.rawFields?.["Comments"] ?? "").trim() && !commentEditMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCommentEditMode(true);
                        setCommentFeedback("");
                      }}
                      style={{
                        padding: "10px 18px",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor: primaryColor,
                        color: "#ffffff",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={commentSubmitting || !reportComment.trim()}
                        onClick={async () => {
                          if (!selected || !reportComment.trim() || commentSubmitting) return;

                          setCommentSubmitting(true);
                          setCommentFeedback("");

                          try {
                            const response = await fetch(
                              "https://n8n.domingogarcia.info/webhook/b4da5467-21f2-453c-975a-17fea31ff277",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  candidateId: selected.id,
                                  candidateName: selected.name,
                                  candidateEmail: selected.email,
                                  comment: reportComment.trim(),
                                  submittedAt: new Date().toISOString(),
                                }),
                              }
                            );

                            if (!response.ok) {
                              throw new Error(`HTTP ${response.status}`);
                            }

                            setCommentFeedback("Submitted");
                            setCommentEditMode(false);

                            setCandidates((previous) =>
                              previous.map((candidate) =>
                                candidate.id === selected.id
                                  ? {
                                      ...candidate,
                                      rawFields: {
                                        ...candidate.rawFields,
                                        Comments: reportComment.trim(),
                                      },
                                    }
                                  : candidate
                              )
                            );

                            setSelected((previous) =>
                              previous
                                ? {
                                    ...previous,
                                    rawFields: {
                                      ...previous.rawFields,
                                      Comments: reportComment.trim(),
                                    },
                                  }
                                : previous
                            );
                          } catch (error) {
                            console.error("Comment webhook failed:", error);
                            setCommentFeedback(
                              "Error: Could not submit comment. Check the webhook and browser console."
                            );
                          } finally {
                            setCommentSubmitting(false);
                          }
                        }}
                        style={{
                          padding: "10px 18px",
                          border: "none",
                          borderRadius: "8px",
                          backgroundColor:
                            commentSubmitting || !reportComment.trim() ? "#94a3b8" : primaryColor,
                          color: "#ffffff",
                          fontWeight: 600,
                          cursor:
                            commentSubmitting || !reportComment.trim() ? "not-allowed" : "pointer",
                        }}
                      >
                        {commentSubmitting ? "Sending..." : "Submit Comment"}
                      </button>
                      {commentEditMode && (
                        <button
                          type="button"
                          disabled={commentSubmitting}
                          onClick={() => {
                            setReportComment(String(selected?.rawFields?.["Comments"] ?? ""));
                            setCommentEditMode(false);
                            setCommentFeedback("");
                          }}
                          style={{
                            padding: "10px 18px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            backgroundColor: "#ffffff",
                            color: "#334155",
                            fontWeight: 600,
                            cursor: commentSubmitting ? "not-allowed" : "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>              {/* Candidate CV / Airtable Attachment */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #DCE5EF',
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
                      const fileUrl = (() => {
                        if (
                          typeof file?.url === "string" &&
                          /^https:\/\/[^/]+\.airtableusercontent\.com\//i.test(file.url)
                        ) {
                          return file.url;
                        }

                        if (typeof file?.path === "string" && file.path.trim()) {
                          return `/api/candidates/cv?path=${encodeURIComponent(file.path)}`;
                        }

                        return "";
                      })();
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
                            border: '1px solid #DCE5EF',
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
                                  href={typeof file?.path === "string" && file.path.trim() ? `/api/candidates/cv?path=${encodeURIComponent(file.path)}&download=1` : fileUrl}
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
                                border: '1px solid #DCE5EF',
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
              <button onClick={() => setInterviewCandidate(null)} style={styles.modalClose}>×</button>
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
    overflowY: "auto",
  overflowX: "hidden",
  maxHeight: "100vh",
  scrollbarWidth: "thin",},
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
    border: '1px solid #DCE5EF',
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
    border: '1px solid #DCE5EF',
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




















































































































