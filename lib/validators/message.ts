import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const markReadSchema = z.object({
  lastReadMessageId: z.string().min(1),
});
