import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth-helpers";
import { assertConversationMember } from "@/lib/conversation-access";
import { prisma } from "@/lib/prisma";
import { markReadSchema } from "@/lib/validators/message";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;

    await assertConversationMember(id, session.user.id);

    const raw = await request.json();
    const parsed = markReadSchema.parse(raw);

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
      data: {
        lastReadMessageId: parsed.lastReadMessageId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}