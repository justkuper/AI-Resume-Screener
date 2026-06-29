import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "resumeStorage",
  access: (allow) => ({
    // Grant all authenticated users read/write/delete to the resumes prefix.
    // Using allow.authenticated() avoids identity-pool ID format mismatches
    // that occur with allow.entity("identity") and the {entity_id} pattern.
    "resumes/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
