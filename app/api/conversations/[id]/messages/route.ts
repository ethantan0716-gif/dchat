import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth-helpers";
import { assertConversationMember } from "@/lib/conversation-access";
import { conversationChannel } from "@/lib/pusher-shared";
import { pusherServer } from "@/lib/pusher-server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { paginationSchema, sendMessageSchema } from "@/lib/validators/message";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await assertConversationMember(id, session.user.id);

    const { searchParams } = new URL(request.url);
    const parsed = paginationSchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: parsed.limit,
      ...(parsed.cursor
        ? {
            cursor: { id: parsed.cursor },
            skip: 1,
          }
        : {}),
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    const nextCursor = messages.length === parsed.limit ? messages[messages.length - 1]?.id : null;

    return NextResponse.json({ messages, nextCursor });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;

    await assertConversationMember(id, session.user.id);

    const rateKey = `${session.user.id}:${id}`;
    const rate = checkRateLimit(rateKey);

    if (!rate.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = sendMessageSchema.parse(raw);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        body: parsed.body,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    await pusherServer.trigger(conversationChannel(id), "message:new", {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
      sender: message.sender,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}