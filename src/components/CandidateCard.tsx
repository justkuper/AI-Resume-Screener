import { useState } from "react";
import type { Schema } from "../../amplify/data/resource";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
} from "lucide-react";

type Candidate = Schema["Candidate"]["type"] & {
  screeningResult?: Schema["ScreeningResult"]["type"] | null;
};

interface Props {
  candidate: Candidate;
  rank: number;
  isScreening: boolean;
}

export default function CandidateCard({ candidate, rank, isScreening }: Props) {
  const [expanded, setExpanded] = useState(false);
  const result = candidate.screeningResult;

  const score = result?.overallScore ?? null;
  const rec = result?.recommendation ?? null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow)",
        overflow: "hidden",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          cursor: result ? "pointer" : "default",
        }}
        onClick={() => result && setExpanded((e) => !e)}
      >
        {/* Rank */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: rank <= 3 ? "var(--color-primary)" : "#f1f5f9",
            color: rank <= 3 ? "#fff" : "var(--color-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {rank}
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{candidate.name}</div>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
            {candidate.resumeFileName}
          </div>
        </div>

        {/* Score */}
        {isScreening ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--color-muted)",
              fontSize: 13,
            }}
          >
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Screening…
          </div>
        ) : score !== null ? (
          <ScoreBadge score={score} />
        ) : (
          <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
            Pending
          </span>
        )}

        {/* Recommendation */}
        {rec && !isScreening && <RecommendationBadge rec={rec} />}

        {/* Expand toggle */}
        {result && (
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--color-muted)",
              padding: 2,
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Score bars row */}
      {result && (
        <div
          style={{
            padding: "0 20px 14px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {(
            [
              ["Experience", result.experienceScore],
              ["Skills", result.skillsScore],
              ["Education", result.educationScore],
              ["Culture Fit", result.fitScore],
            ] as [string, number | null | undefined][]
          ).map(([label, val]) => (
            <ScoreBar key={label} label={label} value={val ?? 0} />
          ))}
        </div>
      )}

      {/* Expanded details */}
      {expanded && result && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "20px 20px",
            background: "#f8fafc",
          }}
        >
          {result.summary && (
            <div style={{ marginBottom: 16 }}>
              <Label>AI Summary</Label>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
                {result.summary}
              </p>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {result.strengths && (
              <div>
                <Label>Strengths</Label>
                <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                  {parseList(result.strengths).map((s, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13,
                        color: "#065f46",
                        marginBottom: 4,
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <CheckCircle2
                        size={13}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.weaknesses && (
              <div>
                <Label>Gaps / Concerns</Label>
                <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                  {parseList(result.weaknesses).map((w, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13,
                        color: "#9a3412",
                        marginBottom: 4,
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertCircle
                        size={13}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: ".5px",
        textTransform: "uppercase",
        color: "var(--color-muted)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  const color =
    pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          marginBottom: 4,
          color: "var(--color-muted)",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{pct}</span>
      </div>
      <div
        style={{
          background: "#e2e8f0",
          borderRadius: 4,
          height: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width .4s ease",
          }}
        />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score);
  const { bg, color } =
    pct >= 75
      ? { bg: "#d1fae5", color: "#065f46" }
      : pct >= 50
      ? { bg: "#fef3c7", color: "#92400e" }
      : { bg: "#fee2e2", color: "#991b1b" };
  return (
    <div
      style={{
        background: bg,
        color,
        fontWeight: 700,
        fontSize: 15,
        padding: "4px 12px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Star size={12} />
      {pct}
    </div>
  );
}

function RecommendationBadge({
  rec,
}: {
  rec: "STRONG_YES" | "YES" | "MAYBE" | "NO";
}) {
  const map = {
    STRONG_YES: { label: "Strong Yes", bg: "#d1fae5", color: "#065f46", Icon: CheckCircle2 },
    YES: { label: "Yes", bg: "#dbeafe", color: "#1e40af", Icon: CheckCircle2 },
    MAYBE: { label: "Maybe", bg: "#fef3c7", color: "#92400e", Icon: AlertCircle },
    NO: { label: "No", bg: "#fee2e2", color: "#991b1b", Icon: XCircle },
  };
  const { label, bg, color, Icon } = map[rec];
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
      }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function parseList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback: split by comma/newline
  }
  return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}
