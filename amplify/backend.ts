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

// Grant the Lambda read access to the S3 bucket and Bedrock
const resumeBucket = backend.storage.resources.bucket;
const lambdaFn = backend.screenResume.resources.lambda as LambdaFunction;

// S3 read access
resumeBucket.grantRead(lambdaFn);

// Pass bucket name as env var
lambdaFn.addEnvironment("STORAGE_BUCKET_NAME", resumeBucket.bucketName);

// Bedrock invocation access
lambdaFn.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
    ],
  })
);
