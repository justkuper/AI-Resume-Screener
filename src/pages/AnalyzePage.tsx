import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";
import type { Schema } from "../../amplify/data/resource";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Zap,
  X,
} from "lucide-react";
import { useGuest } from "../context/GuestContext";
import GuestBanner from "../components/GuestBanner";

const client = generateClient<Schema>();

interface AnalysisResult {
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordsFound: string[];
  keywordsMissing: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  atsTips: string[];
  summary: string;
}

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

export default function AnalyzePage() {
  const { isGuest } = useGuest();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setResumeFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  async function handleAnalyze() {
    if (!resumeFile || !jobTitle.trim() || !jobDescription.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { userId } = await getCurrentUser();
      const key = `resumes/${userId}/${Date.now()}_${resumeFile.name}`;
      await uploadData({ path: key, data: resumeFile }).result;

      const { data, errors } = await client.mutations.analyzeResume({
        resumeKey: key,
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        company: company.trim() || undefined,
        requirements: requirements.trim() || undefined,
      });

      if (errors?.length || !data?.success) {
        setError(errors?.[0]?.message ?? data?.error ?? "Analysis failed. Please try again.");
        return;
      }

      setResult({
        matchScore: data.matchScore ?? 0,
        skillsScore: data.skillsScore ?? 0,
        experienceScore: data.experienceScore ?? 0,
        educationScore: data.educationScore ?? 0,
        keywordsFound: parseList(data.keywordsFound),
        keywordsMissing: parseList(data.keywordsMissing),
        strengths: parseList(data.strengths),
        gaps: parseList(data.gaps),
        suggestions: parseList(data.suggestions),
        atsTips: parseList(data.atsTips),
        summary: data.summary ?? "",
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  if (isGuest) return <GuestBanner />;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Resume Analyzer
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          Upload your resume and paste a job description — AI will show you exactly how to improve your chances.
        </p>
      </div>

      {/* Input form */}
      {!result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Left — resume upload */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: 24,
              boxShadow: "var(--shadow)",
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Your Resume</h2>

            {resumeFile ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  border: "1px solid #a5b4fc",
                  borderRadius: 10,
                  background: "#ede9fe",
                  marginBottom: 12,
                }}
              >
                <FileText size={20} color="#6366f1" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#3730a3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {resumeFile.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>
                    {(resumeFile.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  onClick={() => setResumeFile(null)}
                  style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", padding: 2 }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: 10,
                  padding: 40,
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragActive ? "#ede9fe" : "#f8fafc",
                  transition: "all .15s",
                  marginBottom: 12,
                }}
              >
                <input {...getInputProps()} />
                <Upload size={28} color={isDragActive ? "#6366f1" : "var(--color-muted)"} style={{ margin: "0 auto 10px" }} />
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
                  or click to browse · PDF, DOCX, TXT · max 10 MB
                </p>
              </div>
            )}
          </div>

          {/* Right — job details */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: 24,
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Job Details</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Job Title <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Job Description <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here…"
                rows={7}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Requirements <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Paste any additional requirements or must-haves…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#991b1b", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Analyze button */}
      {!result && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !resumeFile || !jobTitle.trim() || !jobDescription.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: analyzing || !resumeFile || !jobTitle.trim() || !jobDescription.trim()
                ? "#a5b4fc"
                : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px 36px",
              fontWeight: 700,
              fontSize: 16,
              cursor: analyzing || !resumeFile || !jobTitle.trim() || !jobDescription.trim() ? "not-allowed" : "pointer",
              transition: "background .15s",
            }}
          >
            {analyzing ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Analyzing your resume…
              </>
            ) : (
              <>
                <Zap size={18} />
                Analyze My Resume
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Re-analyze button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button
              onClick={reset}
              style={{
                padding: "8px 18px",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                background: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              ← Analyze Another
            </button>
          </div>

          {/* Score overview */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "28px 32px",
              boxShadow: "var(--shadow)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
              {/* Big score */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor(result.matchScore), lineHeight: 1 }}>
                  {Math.round(result.matchScore)}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>Overall Match</div>
              </div>

              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  ["Skills", result.skillsScore],
                  ["Experience", result.experienceScore],
                  ["Education", result.educationScore],
                ].map(([label, score]) => (
                  <ScoreBar key={label as string} label={label as string} score={score as number} />
                ))}
              </div>
            </div>

            {result.summary && (
              <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
                {result.summary}
              </p>
            )}
          </div>

          {/* Keywords */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Section title="Keywords Found" accent="#10b981">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.keywordsFound.map((kw) => (
                  <Chip key={kw} color="#d1fae5" text="#065f46">{kw}</Chip>
                ))}
                {result.keywordsFound.length === 0 && <Empty>None detected</Empty>}
              </div>
            </Section>

            <Section title="Missing Keywords" accent="#ef4444">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.keywordsMissing.map((kw) => (
                  <Chip key={kw} color="#fee2e2" text="#991b1b">{kw}</Chip>
                ))}
                {result.keywordsMissing.length === 0 && <Empty>No critical gaps!</Empty>}
              </div>
            </Section>
          </div>

          {/* Strengths & Gaps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Section title="Strengths" accent="#10b981">
              <BulletList items={result.strengths} icon={<CheckCircle2 size={13} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />} />
            </Section>
            <Section title="Gaps / Concerns" accent="#f59e0b">
              <BulletList items={result.gaps} icon={<AlertCircle size={13} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />} />
            </Section>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <Section title="💡 Suggestions to Improve Your Resume" accent="#6366f1" style={{ marginBottom: 16 }}>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {result.suggestions.map((s, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10, color: "#1e293b" }}>
                    {s}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* ATS Tips */}
          {result.atsTips.length > 0 && (
            <Section title="⚡ ATS Optimization Tips" accent="#8b5cf6">
              <BulletList items={result.atsTips} icon={<Lightbulb size={13} color="#8b5cf6" style={{ marginTop: 2, flexShrink: 0 }} />} />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  accent,
  children,
  style: extraStyle,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: 20,
        boxShadow: "var(--shadow)",
        borderTop: `3px solid ${accent}`,
        ...extraStyle,
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#1e293b" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score);
  const color = scoreColor(pct);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "var(--color-muted)" }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}

function Chip({ color, text, children }: { color: string; text: string; children: React.ReactNode }) {
  return (
    <span style={{ background: color, color: text, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
      {children}
    </span>
  );
}

function BulletList({ items, icon }: { items: string[]; icon: React.ReactNode }) {
  if (items.length === 0) return <Empty>None</Empty>;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
          {icon}
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12, color: "var(--color-muted)", fontStyle: "italic" }}>{children}</span>;
}

function scoreColor(score: number) {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 12,
  marginBottom: 6,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  color: "var(--color-text)",
  boxSizing: "border-box",
};
