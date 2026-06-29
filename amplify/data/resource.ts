import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { screenResume } from "../functions/screenResume/resource";

const schema = a.schema({
  // Dummy model so AppSync generates a valid Query type (required by GraphQL spec).
  // Not used in the frontend.
  UserProfile: a
    .model({
      displayName: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  // Main mutation — inline customType avoids a.ref() resolution issues
  analyzeResume: a
    .mutation()
    .arguments({
      resumeKey: a.string().required(),
      jobTitle: a.string().required(),
      jobDescription: a.string().required(),
      company: a.string(),
      requirements: a.string(),
    })
    .returns(
      a.customType({
        success: a.boolean(),
        matchScore: a.float(),
        skillsScore: a.float(),
        experienceScore: a.float(),
        educationScore: a.float(),
        keywordsFound: a.string(),   // JSON-encoded string[]
        keywordsMissing: a.string(), // JSON-encoded string[]
        strengths: a.string(),       // JSON-encoded string[]
        gaps: a.string(),            // JSON-encoded string[]
        suggestions: a.string(),     // JSON-encoded string[]
        atsTips: a.string(),         // JSON-encoded string[]
        summary: a.string(),
        error: a.string(),
      })
    )
    .handler(a.handler.function(screenResume))
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
