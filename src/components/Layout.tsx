import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, LogOut, Brain, LogIn } from "lucide-react";
import type { AuthUser } from "aws-amplify/auth";
import { useGuest } from "../context/GuestContext";

interface Props {
  children: React.ReactNode;
  user?: AuthUser;
  signOut: () => void;
}

export default function Layout({ children, user, signOut }: Props) {
  const { isGuest, onSignIn } = useGuest();
  const { pathname } = useLocation();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/jobs/new", icon: PlusCircle, label: "New Job" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: "#1e1b4b",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "0 20px 24px",
            borderBottom: "1px solid rgba(255,255,255,.1)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Brain size={24} color="#a5b4fc" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            RecruitAI
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                  color: active ? "#fff" : "rgba(255,255,255,.6)",
                  background: active
                    ? "rgba(255,255,255,.12)"
                    : "transparent",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: "all .15s",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + signout / guest */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,.1)",
          }}
        >
          {isGuest ? (
            <>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginBottom: 8, fontStyle: "italic" }}>
                Guest mode — data not saved
              </div>
              <button
                onClick={onSignIn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#a5b4fc",
                  background: "transparent",
                  border: "none",
                  fontSize: 13,
                  padding: "6px 0",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <LogIn size={14} />
                Sign in / Sign up
              </button>
            </>
          ) : (
            <>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginBottom: 8 }}>
                {user?.signInDetails?.loginId}
              </div>
              <button
                onClick={signOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "rgba(255,255,255,.6)",
                  background: "transparent",
                  border: "none",
                  fontSize: 13,
                  padding: "6px 0",
                  cursor: "pointer",
                }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
