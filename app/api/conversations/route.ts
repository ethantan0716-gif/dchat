import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireSession } from "@/lib/auth-helpers";
import { makeJoinCode } from "@/lib/join-code";
import { prisma } from "@/lib/prisma";
import { createConversationSchema } from "@/lib/validators/conversation";

export async function GET() {
  try {
    const session = await requireSession();

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true, email: true } } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const raw = await request.json();
    const parsed = createConversationSchema.parse(raw);

    const memberIds = Array.from(new Set([session.user.id, ...parsed.participantIds]));

    if (parsed.type === "DM" && memberIds.length !== 2) {
      return NextResponse.json({ error: "DM requires exactly two participants" }, { status: 400 });
    }

    const baseData: Omit<Prisma.ConversationCreateInput, "joinCode"> = {
      type: parsed.type,
      title: parsed.type === "GROUP" ? parsed.title?.trim() : null,
      createdBy: { connect: { id: session.user.id } },
      members: {
        create: memberIds.map((userId) => ({
          role: userId === session.user.id ? "owner" : "member",
          user: { connect: { id: userId } },
        })),
      },
    };

    let conversation;
    if (parsed.type === "GROUP") {
      for (let i = 0; i < 5; i += 1) {
        try {
          conversation = await prisma.conversation.create({
            data: {
              ...baseData,
              joinCode: makeJoinCode(8),
            },
            include: {
              members: {
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
              },
            },
          });
          break;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            continue;
          }
          throw error;
        }
      }
    } else {
      conversation = await prisma.conversation.create({
        data: baseData,
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
        },
      });
    }

    if (!conversation) {
      return NextResponse.json({ error: "Unable to generate a unique join code. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
