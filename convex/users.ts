import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { userId, name, email }) => {
    //check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingUser) {
      //update existing user
      await ctx.db.patch(existingUser._id, {
        name,
        email,
      });

      return existingUser._id;
    }

    //create new user
    return await ctx.db.insert("users", {
      userId,
      name,
      email,
      stripeConnectId: undefined,
    });
  },
});
