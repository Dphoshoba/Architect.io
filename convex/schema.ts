
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  history: defineTable({
    userId: v.string(),
    input: v.any(),
    output: v.any(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  logs: defineTable({
    type: v.string(),
    status: v.string(),
    payload: v.any(),
    timestamp: v.number(),
  }),

  userStatus: defineTable({
    userId: v.string(),
    plan: v.string(),
    creditsRemaining: v.number(),
    totalCredits: v.number(),
  }).index("by_user", ["userId"]),

  apiKeys: defineTable({
    label: v.string(),
    key: v.string(),
    created: v.number(),
  }),
});
