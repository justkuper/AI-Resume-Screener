import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";
import type { Schema } from "../../amplify/data/resource";
import ResumeUploader from "../components/ResumeUploader";
import CandidateCard from "../components/CandidateCard";
import { Briefcase, ChevronLeft, Upload, Users, Loader2 } from "lucide-react";

const client = generateClient<Schema>();

type Job = Schema["Job"]["type"];
type Candidate = Omit<Schema["Candidate"]["type"], "screeningResult"> & {
  screeningResult?: Schema["ScreeningResult"]["type"] | null;
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [screeningIds, setScreeningIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!jobId) return;
    const [{ data: j }, { data: cs }] = await Promise.all([
      client.models.Job.get({ id: jobId }),
      client.models.Candidate.list({ filter: { jobId: { eq: jobId } } }),
    ]);
    setJob(j as Job);

    // Attach screening results
    const enriched = await Promise.all(
      (cs ?? []).map(async (c) => {
        const { data: results } = await client.models.ScreeningResult.list({
          filter: { candidateId: { eq: c.id } },
        });
        return { ...c, screeningResult: results?.[0] ?? null } as Candidate;
      })
    );

    // Sort by score desc
    enriched.sort(
      (a, b) =>
        (b.screeningResult?.overallScore ?? -1) -
        (a.screeningResult?.overallScore ?? -1)
    );
    setCandidates(enriched);
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(files: File[], names: string[]) {
    if (!job || !jobId) return;
    const { userId } = await getCurrentUser();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const candidateName = names[i] || file.name.replace(/\.[^.]+$/, "");
      const key = `resumes/${userId}/${Date.now()}_${file.name}`;

      // Upload to S3
      await uploadData({ path: key, data: file }).result;

      // Create candidate record
      const { data: candidate } = await client.models.Candidate.create({
        jobId,
        name: candidateName,
        resumeKey: key,
        resumeFileName: file.name,
        status: "PENDING",
      });

      if (!candidate) continue;
      setCandidates((prev) => [{ ...candidate, screeningResult: null } as unknown as Candidate, ...prev]);
      screenCandidate(candidate.id, key, job);
    }
    setShowUploader(false);
  }

  async function screenCandidate(candidateId: string, resumeKey: string, j: Job) {
    setScreeningIds((s) => new Set(s).add(candidateId));
    await client.models.Candidate.update({ id: candidateId, status: "SCREENING" });

    try {
      // Call Bedrock via AppSync custom mutation
      const { data: result, errors } = await client.mutations.screenResume({
        candidateId,
        jobId: j.id,
        resumeKey,
        jobTitle: j.title,
        jobDescription: j.description,
        jobRequirements: j.requirements ?? "",
      });

      if (errors?.length || !result?.success) {
        console.error("Screening errors", errors);
        await client.models.Candidate.update({ id: candidateId, status: "SCREENED" });
        return;
      }

      // Persist screening result
      await client.models.ScreeningResult.create({
        candidateId,
        overallScore: result.overallScore ?? undefined,
        experienceScore: result.experienceScore ?? undefined,
        skillsScore: result.skillsScore ?? undefined,
        educationScore: result.educationScore ?? undefined,
        fitScore: result.fitScore ?? undefined,
        summary: result.summary ?? undefined,
        strengths: result.strengths ?? undefined,
        weaknesses: result.weaknesses ?? undefined,
        recommendation:
          (result.recommendation as "STRONG_YES" | "YES" | "MAYBE" | "NO") ??
          "MAYBE",
      });

      const newStatus =
        result.recommendation === "NO" ? "REJECTED" : "SHORTLISTED";
      await client.models.Candidate.update({ id: candidateId, status: newStatus });
    } catch (err) {
      console.error("Screening error", err);
      await client.models.Candidate.update({ id: candidateId, status: "SCREENED" });
    } finally {
      setScreeningIds((s) => {
        const next = new Set(s);
        next.delete(candidateId);
        return next;
      });
      load();
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--color-muted)" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: 40 }}>
        <p>Job not found.</p>
        <button onClick={() => navigate("/dashboard")}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-muted)", background: "none", border: "none", fontSize: 13, marginBottom: 20, cursor: "pointer" }}
      >
        <ChevronLeft size={14} /> Dashboard
      </button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "var(--color-primary-light)", borderRadius: 10, padding: 10, color: "var(--color-primary)" }}>
            <Briefcase size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{job.title}</h1>
            <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 2 }}>
              {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          <Upload size={15} />
          Upload Resumes
        </button>
      </div>

      {/* Uploader modal */}
      {showUploader && (
        <ResumeUploader onUpload={handleUpload} onClose={() => setShowUploader(false)} />
      )}

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <div style={{ background: "var(--color-surface)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius)", padding: 60, textAlign: "center" }}>
          <Users size={40} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No candidates yet</div>
          <div style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 20 }}>
            Upload resumes to start AI screening
          </div>
          <button
            onClick={() => setShowUploader(true)}
            style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Upload Resumes
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {candidates.map((c, idx) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              rank={idx + 1}
              isScreening={screeningIds.has(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
