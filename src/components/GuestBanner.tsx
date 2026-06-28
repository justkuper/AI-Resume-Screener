import { Brain, LogIn } from "lucide-react";
import { useGuest } from "../context/GuestContext";

export default function GuestBanner() {
  const { onSignIn } = useGuest();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: 40,
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#ede9fe",
            color: "#6366f1",
            marginBottom: 20,
          }}
        >
          <Brain size={32} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Sign in to use RecruitAI
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-muted)", lineHeight: 1.6, marginBottom: 28 }}>
          Create jobs, upload resumes, and let AI screen your candidates — all your
          data is saved securely to your account.
        </p>

        <button
          onClick={onSignIn}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "11px 24px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <LogIn size={15} />
          Sign in / Create account
        </button>

        <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 16 }}>
          Free to sign up — no credit card required.
        </p>
      </div>
    </div>
  );
}
