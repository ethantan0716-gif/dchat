import { z } from "zod";

export const createConversationSchema = z
  .object({
    type: z.enum(["DM", "GROUP"]),
    participantIds: z.array(z.string().min(1)),
    title: z.string().max(100).optional(),
  })
  .superRefine((value, context) => {
    if (value.type === "DM" && value.participantIds.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["participantIds"],
        message: "Direct messages require exactly one participant",
      });
    }

    if (value.type === "GROUP" && (!value.title || value.title.trim().length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "Group chats require a title",
      });
    }
  });

export const joinConversationSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(6)
    .max(12)
    .regex(/^[A-Z0-9]+$/, "Join code should use letters and numbers only"),
});
