import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Trash2, Check } from "lucide-react";

interface Props {
  onUpload: (files: File[], names: string[]) => Promise<void>;
  onClose: () => void;
}

interface FileEntry {
  file: File;
  name: string;
}

export default function ResumeUploader({ onUpload, onClose }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setEntries((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        file: f,
        name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  function updateName(idx: number, name: string) {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, name } : e))
    );
  }

  function remove(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (!entries.length) return;
    setUploading(true);
    try {
      await onUpload(
        entries.map((e) => e.file),
        entries.map((e) => e.name)
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "min(600px, 95vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Upload Resumes</h2>
            <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 2 }}>
              PDF, DOCX, or TXT — max 10 MB each
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-muted)",
              borderRadius: 6,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Drop zone */}
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: 10,
              padding: 32,
              textAlign: "center",
              cursor: "pointer",
              background: isDragActive ? "var(--color-primary-light)" : "#f8fafc",
              transition: "all .15s",
              marginBottom: entries.length > 0 ? 20 : 0,
            }}
          >
            <input {...getInputProps()} />
            <Upload
              size={28}
              color={isDragActive ? "var(--color-primary)" : "var(--color-muted)"}
              style={{ margin: "0 auto 10px" }}
            />
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {isDragActive ? "Drop files here" : "Drag & drop resumes here"}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
              or click to browse
            </p>
          </div>

          {/* File list */}
          {entries.map((entry, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                marginBottom: 8,
                background: "#fff",
              }}
            >
              <FileText size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateName(idx, e.target.value)}
                  placeholder="Candidate name"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "var(--color-text)",
                    background: "transparent",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>
                  {entry.file.name} · {(entry.file.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button
                onClick={() => remove(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-danger)",
                  opacity: 0.6,
                  padding: 4,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              padding: "9px 18px",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              background: "#fff",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={entries.length === 0 || uploading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 20px",
              background:
                entries.length === 0 || uploading
                  ? "#a5b4fc"
                  : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {uploading ? (
              <>Uploading…</>
            ) : (
              <>
                <Check size={14} />
                Screen {entries.length} Resume{entries.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
