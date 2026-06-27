import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { AppSyncResolverHandler } from "aws-lambda";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? "us-east-1",
});

// ── Types ────────────────────────────────────────────────────────────────────

interface MutationArgs {
  candidateId: string;
  jobId: string;
  resumeKey: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements?: string | null;
}

interface ScreeningResult {
  success: boolean;
  overallScore?: number;
  experienceScore?: number;
  skillsScore?: number;
  educationScore?: number;
  fitScore?: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
  error?: string;
}

interface BedrockScores {
  overallScore: number;
  experienceScore: number;
  skillsScore: number;
  educationScore: number;
  fitScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: "STRONG_YES" | "YES" | "MAYBE" | "NO";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getResumeText(key: string): Promise<string> {
  const bucket = process.env.STORAGE_BUCKET_NAME;
  if (!bucket) throw new Error("STORAGE_BUCKET_NAME env var not set");

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error("Empty S3 response");
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes).toString("utf-8");
}

async function callBedrock(
  resumeText: string,
  job: { title: string; description: string; requirements?: string | null }
): Promise<BedrockScores> {
  const systemPrompt = `You are an expert recruiter and resume evaluator.
Objectively score candidates against a job description.
Always respond with valid JSON only — no markdown, no commentary outside JSON.`;

  const userPrompt = `Evaluate this resume against the job description.

## Job Title
${job.title}

## Job Description
${job.description}

## Requirements
${job.requirements ?? "Not specified"}

## Resume
${resumeText.slice(0, 12000)}

## Response (JSON only)
{
  "overallScore": <0-100>,
  "experienceScore": <0-100>,
  "skillsScore": <0-100>,
  "educationScore": <0-100>,
  "fitScore": <0-100>,
  "summary": "<2-3 sentence candidate summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<gap 1>", "<gap 2>"],
  "recommendation": "<STRONG_YES | YES | MAYBE | NO>"
}

Weights: experience 35%, skills 35%, education 15%, fit 15%.`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const cmd = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body,
  });

  const res = await bedrock.send(cmd);
  const raw = JSON.parse(Buffer.from(res.body).toString("utf-8"));
  const text: string = raw.content[0].text.trim();
  const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(clean) as BedrockScores;
}

// ── AppSync handler ──────────────────────────────────────────────────────────

export const handler: AppSyncResolverHandler<MutationArgs, ScreeningResult> =
  async (event) => {
    const {
      resumeKey,
      jobTitle,
      jobDescription,
      jobRequirements,
    } = event.arguments;

    try {
      const resumeText = await getResumeText(resumeKey);
      const scores = await callBedrock(resumeText, {
        title: jobTitle,
        description: jobDescription,
        requirements: jobRequirements,
      });

      return {
        success: true,
        ...scores,
        strengths: JSON.stringify(scores.strengths),
        weaknesses: JSON.stringify(scores.weaknesses),
      };
    } catch (err) {
      console.error("Screening failed", err);
      return { success: false, error: String(err) };
    }
  };
