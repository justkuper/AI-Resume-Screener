import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { Briefcase, ChevronLeft } from "lucide-react";

const client = generateClient<Schema>();

export default function NewJobPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const { data } = await client.models.Job.create({
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        status: "OPEN",
      });
      navigate(`/jobs/${data!.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 720 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-muted)",
          background: "none",
          border: "none",
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Create New Job
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          Provide the job details — the AI will use this to score candidates
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          padding: 32,
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Field label="Job Title" required>
          <input
            type="text"
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. Senior Software Engineer"
            required
            style={inputStyle}
          />
        </Field>

        <Field
          label="Job Description"
          required
          hint="Paste the full job description"
        >
          <textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Describe responsibilities, team, company culture…"
            required
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <Field
          label="Requirements"
          hint="Skills, qualifications, must-haves (optional but improves scoring)"
        >
          <textarea
            value={form.requirements}
            onChange={set("requirements")}
            placeholder="e.g. 5+ years React, BS in CS or equivalent, AWS experience…"
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              background: "#fff",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              background: saving ? "#a5b4fc" : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <Briefcase size={15} />
            {saving ? "Saving…" : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontWeight: 600, fontSize: 13 }}>
        {label}{" "}
        {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
      </label>
      {hint && (
        <span style={{ fontSize: 12, color: "var(--color-muted)", marginTop: -2 }}>
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  color: "var(--color-text)",
};
