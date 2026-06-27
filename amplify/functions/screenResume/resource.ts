import { defineFunction } from "@aws-amplify/backend";

export const screenResume = defineFunction({
  name: "screenResume",
  entry: "./handler.ts",
  timeoutSeconds: 120,
  memoryMB: 1024,
  environment: {
    BEDROCK_REGION: "us-east-1",
    BEDROCK_MODEL_ID: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    // STORAGE_BUCKET_NAME is injected at deploy time by Amplify
    // when you grant the function access to the storage resource in backend.ts
  },
});
