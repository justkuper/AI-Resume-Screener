import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { screenResume } from "./functions/screenResume/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";

const backend = defineBackend({
  auth,
  data,
  storage,
  screenResume,
});

const resumeBucket = backend.storage.resources.bucket;
const lambdaFn = backend.screenResume.resources.lambda as LambdaFunction;

// S3 read access so Lambda can fetch uploaded resumes
resumeBucket.grantRead(lambdaFn);

// Pass bucket name and model ID as env vars
lambdaFn.addEnvironment("STORAGE_BUCKET_NAME", resumeBucket.bucketName);
// Claude Sonnet 4.6 — use US geo cross-region ID (us-east-1 has no in-region capacity)
lambdaFn.addEnvironment("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6"); // geo ID routes within US regardless of source region

// Bedrock invocation — cover both foundation-model and inference-profile ARN formats
lambdaFn.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [
      "arn:aws:bedrock:*::foundation-model/anthropic.claude*",
      "arn:aws:bedrock:*:*:inference-profile/*anthropic.claude*",
    ],
  })
);

// AWS Marketplace permissions required for Anthropic models served via Marketplace
lambdaFn.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "aws-marketplace:ViewSubscriptions",
      "aws-marketplace:Subscribe",
      "aws-marketplace:Unsubscribe",
    ],
    resources: ["*"],
  })
);
