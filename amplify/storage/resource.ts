import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "resumeStorage",
  access: (allow) => ({
    "resumes/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
});
