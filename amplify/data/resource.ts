import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { screenResume } from "../functions/screenResume/resource";

const schema = a.schema({
  // Custom return type for the analyzeResume mutation
  AnalysisOutput: a.customType({
    success: a.boolean(),
    matchScore: a.float(),
    skillsScore: a.float(),
    experienceScore: a.float(),
    educationScore: a.float(),
    keywordsFound: a.string(),   // JSON string[]
    keywordsMissing: a.string(), // JSON string[]
    strengths: a.string(),       // JSON string[]
    gaps: a.string(),            // JSON string[]
    suggestions: a.string(),     // JSON string[]
    atsTips: a.string(),         // JSON string[]
    summary: a.string(),
    error: a.string(),
  }),

  analyzeResume: a
    .mutation()
    .arguments({
      resumeKey: a.string().required(),
      jobTitle: a.string().required(),
      jobDescription: a.string().required(),
      company: a.string(),
      requirements: a.string(),
    })
    .returns(a.ref("AnalysisOutput"))
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
