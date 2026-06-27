import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { screenResume } from "../functions/screenResume/resource";

const schema = a.schema({
  Job: a
    .model({
      title: a.string().required(),
      description: a.string().required(),
      requirements: a.string(),
      status: a.enum(["OPEN", "CLOSED", "ARCHIVED"]),
      candidates: a.hasMany("Candidate", "jobId"),
    })
    .authorization((allow) => [allow.owner()]),

  Candidate: a
    .model({
      jobId: a.id().required(),
      job: a.belongsTo("Job", "jobId"),
      name: a.string().required(),
      email: a.string(),
      resumeKey: a.string().required(),
      resumeFileName: a.string(),
      screeningResult: a.hasOne("ScreeningResult", "candidateId"),
      status: a.enum(["PENDING", "SCREENING", "SCREENED", "REJECTED", "SHORTLISTED"]),
    })
    .authorization((allow) => [allow.owner()]),

  ScreeningResult: a
    .model({
      candidateId: a.id().required(),
      candidate: a.belongsTo("Candidate", "candidateId"),
      overallScore: a.float(),
      experienceScore: a.float(),
      skillsScore: a.float(),
      educationScore: a.float(),
      fitScore: a.float(),
      summary: a.string(),
      strengths: a.string(),   // JSON array
      weaknesses: a.string(),  // JSON array
      recommendation: a.enum(["STRONG_YES", "YES", "MAYBE", "NO"]),
      rawExtractedText: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  // Custom mutation — triggers Lambda which calls Bedrock
  screenResume: a
    .mutation()
    .arguments({
      candidateId: a.string().required(),
      jobId: a.string().required(),
      resumeKey: a.string().required(),
      jobTitle: a.string().required(),
      jobDescription: a.string().required(),
      jobRequirements: a.string(),
    })
    .returns(
      a.customType({
        success: a.boolean(),
        overallScore: a.float(),
        experienceScore: a.float(),
        skillsScore: a.float(),
        educationScore: a.float(),
        fitScore: a.float(),
        summary: a.string(),
        strengths: a.string(),
        weaknesses: a.string(),
        recommendation: a.string(),
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
