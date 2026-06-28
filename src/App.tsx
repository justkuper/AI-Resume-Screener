import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Dashboard from "./pages/Dashboard";
import NewJobPage from "./pages/NewJobPage";
import JobDetailPage from "./pages/JobDetailPage";
import Layout from "./components/Layout";
import { GuestContext } from "./context/GuestContext";

const appRoutes = (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/jobs/new" element={<NewJobPage />} />
    <Route path="/jobs/:jobId" element={<JobDetailPage />} />
  </Routes>
);

export default function App() {
  const [isGuest, setIsGuest] = useState(false);

  // Guest mode — bypass Authenticator entirely
  if (isGuest) {
    return (
      <GuestContext.Provider value={{ isGuest: true, onSignIn: () => setIsGuest(false) }}>
        <Layout signOut={() => setIsGuest(false)}>
          {appRoutes}
        </Layout>
      </GuestContext.Provider>
    );
  }

  const guestFooter = () => (
    <div style={{ textAlign: "center", padding: "4px 0 20px" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>Just browsing? </span>
      <button
        onClick={() => setIsGuest(true)}
        style={{
          background: "none",
          border: "none",
          color: "#6366f1",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        Continue as Guest
      </button>
    </div>
  );

  return (
    <Authenticator components={{ SignIn: { Footer: guestFooter } }}>
      {({ signOut, user }) => (
        <GuestContext.Provider value={{ isGuest: false, onSignIn: () => {} }}>
          <Layout user={user} signOut={signOut!}>
            {appRoutes}
          </Layout>
        </GuestContext.Provider>
      )}
    </Authenticator>
  );
}
