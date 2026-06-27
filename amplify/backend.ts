import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { screenResume } from "./functions/screenResume/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
  storage,
  screenResume,
});

// Grant the Lambda read access to the S3 bucket and Bedrock
const resumeBucket = backend.storage.resources.bucket;
const lambdaRole = backend.screenResume.resources.lambda.role!;

// S3 read access
resumeBucket.grantRead(backend.screenResume.resources.lambda);

// Pass bucket name as env var
backend.screenResume.resources.lambda.addEnvironment(
  "STORAGE_BUCKET_NAME",
  resumeBucket.bucketName
);

// Bedrock invocation access
backend.screenResume.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
    ],
  })
);
