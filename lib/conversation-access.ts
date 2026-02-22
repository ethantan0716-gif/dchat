import { prisma } from "@/lib/prisma";

export async function assertConversationMember(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { id: true },
  });

  if (!member) {
    throw new Error("Forbidden");
  }
}
