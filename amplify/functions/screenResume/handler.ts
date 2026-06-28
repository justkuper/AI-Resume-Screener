import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { AppSyncResolverHandler } from "aws-lambda";
// @ts-expect-error — pdf-parse has no bundled types
import pdfParse from "pdf-parse";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? "us-east-1",
});

// ── Types ────────────────────────────────────────────────────────────────────

interface MutationArgs {
  resumeKey: string;
  jobTitle: string;
  jobDescription: string;
  company?: string | null;
  requirements?: string | null;
}

interface AnalysisResult {
  success: boolean;
  matchScore?: number;
  skillsScore?: number;
  experienceScore?: number;
  educationScore?: number;
  keywordsFound?: string;
  keywordsMissing?: string;
  strengths?: string;
  gaps?: string;
  suggestions?: string;
  atsTips?: string;
  summary?: string;
  error?: string;
}

interface BedrockAnalysis {
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordsFound: string[];
  keywordsMissing: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  atsTips: string[];
  summary: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getResumeText(key: string): Promise<string> {
  const bucket = process.env.STORAGE_BUCKET_NAME;
  if (!bucket) throw new Error("STORAGE_BUCKET_NAME env var not set");

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error("Empty S3 response");

  const bytes = await res.Body.transformToByteArray();
  const buffer = Buffer.from(bytes);

  // Try PDF parsing first, fall back to raw text
  if (buffer[0] === 0x25 && buffer[1] === 0x50) {
    // Starts with "%P" — likely a PDF
    const parsed = await pdfParse(buffer);
    return parsed.text ?? "";
  }

  return buffer.toString("utf-8");
}

async function callBedrock(
  resumeText: string,
  job: { title: string; description: string; company?: string | null; requirements?: string | null }
): Promise<BedrockAnalysis> {
  const systemPrompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist.
Your job is to help job seekers improve their resumes to better match specific job descriptions.
Analyze the resume critically and honestly — give specific, actionable advice.
Always respond with valid JSON only — no markdown, no text outside the JSON object.`;

  const userPrompt = `Analyze this resume against the job description below and provide a comprehensive report to help the candidate improve their resume.

## Job Title
${job.title}${job.company ? ` at ${job.company}` : ""}

## Job Description
${job.description}

## Requirements
${job.requirements ?? "Not specified"}

## Resume
${resumeText.slice(0, 12000)}

## Instructions
Score the resume against the job, identify keyword gaps, and provide specific rewrite suggestions that would help this candidate get past ATS filters and impress hiring managers.

For "suggestions", give concrete before/after style rewrites (e.g., "Change 'helped with marketing campaigns' to 'Led 3 email marketing campaigns that increased open rates by 22%'").

For "atsTips", give specific ATS optimization advice for this particular job (e.g., "Add 'Agile' explicitly — it appears 4 times in the JD but not in your resume").

## Response (JSON only)
{
  "matchScore": <0-100, overall match>,
  "skillsScore": <0-100, technical skills alignment>,
  "experienceScore": <0-100, experience level and relevance>,
  "educationScore": <0-100, education and certifications>,
  "keywordsFound": ["<keyword from JD that appears in resume>", ...],
  "keywordsMissing": ["<important keyword from JD missing in resume>", ...],
  "strengths": ["<specific strength backed by resume content>", ...],
  "gaps": ["<specific gap or weakness>", ...],
  "suggestions": ["<specific rewrite suggestion>", ...],
  "atsTips": ["<ATS optimization tip specific to this job>", ...],
  "summary": "<2-3 sentence honest overall assessment>"
}`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2048,
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
  return JSON.parse(clean) as BedrockAnalysis;
}

// ── AppSync handler ──────────────────────────────────────────────────────────

export const handler: AppSyncResolverHandler<MutationArgs, AnalysisResult> =
  async (event) => {
    const { resumeKey, jobTitle, jobDescription, company, requirements } =
      event.arguments;

    try {
      const resumeText = await getResumeText(resumeKey);
      const analysis = await callBedrock(resumeText, {
        title: jobTitle,
        description: jobDescription,
        company,
        requirements,
      });

      return {
        success: true,
        matchScore: analysis.matchScore,
        skillsScore: analysis.skillsScore,
        experienceScore: analysis.experienceScore,
        educationScore: analysis.educationScore,
        keywordsFound: JSON.stringify(analysis.keywordsFound),
        keywordsMissing: JSON.stringify(analysis.keywordsMissing),
        strengths: JSON.stringify(analysis.strengths),
        gaps: JSON.stringify(analysis.gaps),
        suggestions: JSON.stringify(analysis.suggestions),
        atsTips: JSON.stringify(analysis.atsTips),
        summary: analysis.summary,
      };
    } catch (err) {
      console.error("Analysis failed", err);
      return { success: false, error: String(err) };
    }
  };
