import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { Briefcase, Users, TrendingUp, PlusCircle, ChevronRight } from "lucide-react";
import { useGuest } from "../context/GuestContext";
import GuestBanner from "../components/GuestBanner";

const client = generateClient<Schema>();

interface Job {
  id: string;
  title: string;
  status?: string | null;
  createdAt: string;
  candidates?: { items?: unknown[] } | null;
}

export default function Dashboard() {
  const { isGuest } = useGuest();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest) loadJobs();
    else setLoading(false);
  }, [isGuest]);

  async function loadJobs() {
    try {
      const { data } = await client.models.Job.list();
      setJobs(data as Job[]);
    } finally {
      setLoading(false);
    }
  }

  const open = jobs.filter((j) => j.status === "OPEN" || !j.status).length;

  if (isGuest) return <GuestBanner />;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Manage your open roles and candidate pipeline
          </p>
        </div>
        <Link to="/jobs/new">
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <PlusCircle size={16} />
            New Job
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "#6366f1" },
          { label: "Open Roles", value: open, icon: TrendingUp, color: "#10b981" },
          { label: "Jobs Screened", value: jobs.length, icon: Users, color: "#f59e0b" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "var(--shadow)",
            }}
          >
            <div
              style={{
                background: color + "1a",
                borderRadius: 8,
                padding: 10,
                color,
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Job List */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          All Jobs
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
            Loading…
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Briefcase size={40} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No jobs yet</div>
            <div style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 20 }}>
              Create your first job to start screening candidates
            </div>
            <Link to="/jobs/new">
              <button
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Create Job
              </button>
            </Link>
          </div>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid var(--color-border)",
                transition: "background .1s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#f8fafc")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "")
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    background: "var(--color-primary-light)",
                    borderRadius: 8,
                    padding: 8,
                    color: "var(--color-primary)",
                  }}
                >
                  <Briefcase size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <StatusBadge status={job.status ?? "OPEN"} />
                <ChevronRight size={16} color="var(--color-muted)" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    OPEN: { bg: "#d1fae5", color: "#065f46", label: "Open" },
    CLOSED: { bg: "#fee2e2", color: "#991b1b", label: "Closed" },
    ARCHIVED: { bg: "#f1f5f9", color: "#475569", label: "Archived" },
  };
  const s = map[status] ?? map.OPEN;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        letterSpacing: ".3px",
      }}
    >
      {s.label}
    </span>
  );
}
