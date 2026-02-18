import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const validateInternalKey = (key: string) => {
  const internalKey = process.env.POINTER_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    throw new Error("Internal key is not set in environment variables.");
  }
  if (key !== internalKey) {
    throw new Error("Invalid internal key provided.");
  }
};

export const getConversationById = query({
  args: {
    conversationId: v.id("conversations"),
    internalKey: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    return conversation;
  },
});

export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    content: v.string(),
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: args.projectId,
      content: args.content,
      role: args.role,
      status: args.status ?? "completed",
    });
    await ctx.db.patch("conversations", args.conversationId, {
      updatedAt: Date.now(),
    });
    return messageId;
  },
});

export const updateMessageContent = mutation({
    args:{
        internalKey: v.string(),
        messageId: v.id("messages"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey)
        await ctx.db.patch(args.messageId,{
                content: args.content,
                status: "completed" as const
        })
    }
})
