import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { WAITING_LIST_STATUS } from "@/convex/constants";

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
