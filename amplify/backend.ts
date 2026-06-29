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
lambdaFn.addEnvironment("BEDROCK_MODEL_ID", "anthropic.claude-3-7-sonnet-20250219-v1:0");

// Bedrock invocation access — wildcard covers all Claude models to avoid EOL churn
lambdaFn.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude*",
    ],
  })
);
