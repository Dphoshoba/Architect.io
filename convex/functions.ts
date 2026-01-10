
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const savePrompt = mutation({
  args: { 
    userId: v.string(), 
    input: v.any(), 
    output: v.any() 
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("history", {
      userId: args.userId,
      input: args.input,
      output: args.output,
      timestamp: Date.now(),
    });

    // Log the event
    await ctx.db.insert("logs", {
      type: "prompt.generated",
      status: "success",
      payload: { promptId: id },
      timestamp: Date.now(),
    });

    // Deduct credits
    const user = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (user) {
      await ctx.db.patch(user._id, {
        creditsRemaining: Math.max(0, user.creditsRemaining - 25),
      });
    }
    
    return id;
  },
});

export const getUserStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    
    // FIX: Queries cannot perform database writes like ctx.db.insert.
    // Instead of attempting to auto-provision in a query, we return a default object.
    if (!user) {
      return {
        userId: args.userId,
        plan: "Starter",
        creditsRemaining: 450,
        totalCredits: 1000,
      };
    }
    return user;
  },
});

export const getLogs = query({
  handler: async (ctx) => {
    // FIX: .take(20) returns a Promise resolving to an array; .collect() is not required and is not defined on the promise result.
    return await ctx.db.query("logs").order("desc").take(20);
  },
});

export const getApiKeys = query({
  handler: async (ctx) => {
    return await ctx.db.query("apiKeys").collect();
  },
});
