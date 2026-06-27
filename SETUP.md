# AI Resume Screener — Setup Guide

## Prerequisites

- Node.js 18+
- AWS account with CLI configured (`aws configure`)
- Bedrock model access enabled: `anthropic.claude-3-5-sonnet-20241022-v2:0` in `us-east-1`

## 1. Install dependencies

```bash
npm install
```

## 2. Start the Amplify sandbox (deploys backend to AWS)

```bash
npx ampx sandbox
```

This provisions:
- **Cognito** (auth)
- **AppSync + DynamoDB** (data: Job, Candidate, ScreeningResult)
- **S3** (resume storage)
- **Lambda** (screenResume — calls Bedrock)

It also generates `amplify_outputs.json` automatically — replacing the placeholder file.

## 3. Grant Bedrock permissions to the Lambda

After sandbox starts, add this policy to the `screenResume` Lambda execution role in IAM:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
}
```

Or via CDK in `amplify/functions/screenResume/resource.ts`:

```ts
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export const screenResume = defineFunction({
  // ...existing config...
});

// Add after defineFunction:
screenResume.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: ["bedrock:InvokeModel"],
  resources: ["arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"],
}));
```

## 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173

## Architecture

```
Browser (React + Amplify UI)
  │
  ├── Cognito Auth       — sign up / sign in
  ├── AppSync (GraphQL)  — CRUD for Jobs, Candidates, ScreeningResults
  ├── S3                 — resume file storage
  └── Lambda             — screenResume
        └── Bedrock      — Claude 3.5 Sonnet scores the resume
```

## Workflow

1. Create a **Job** with title, description, requirements
2. Upload one or more resumes (PDF/DOCX/TXT)
3. Each resume is uploaded to S3, then the Lambda is invoked automatically
4. Claude scores the resume on Experience, Skills, Education, and Culture Fit
5. Candidates appear ranked by score with AI summaries, strengths, and gaps

## Deploy to production

```bash
npx ampx pipeline-deploy --branch main --app-id <your-amplify-app-id>
```

Connect your repo in AWS Amplify Console for CI/CD.
