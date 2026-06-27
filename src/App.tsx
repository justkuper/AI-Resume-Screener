import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Dashboard from "./pages/Dashboard";
import NewJobPage from "./pages/NewJobPage";
import JobDetailPage from "./pages/JobDetailPage";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <Layout user={user} signOut={signOut!}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs/new" element={<NewJobPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          </Routes>
        </Layout>
      )}
    </Authenticator>
  );
}
