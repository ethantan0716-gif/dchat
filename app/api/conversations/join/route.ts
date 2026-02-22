import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { joinConversationSchema } from "@/lib/validators/conversation";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const raw = await request.json();
    const parsed = joinConversationSchema.parse({
      joinCode: String(raw?.joinCode ?? "").toUpperCase(),
    });

    const conversation = await prisma.conversation.findFirst({
      where: {
        type: "GROUP",
        joinCode: parsed.joinCode,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Group not found for this code" }, { status: 404 });
    }

    await prisma.conversationMember.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        conversationId: conversation.id,
        userId: session.user.id,
        role: "member",
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
      select: { id: true },
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
