import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ChatRoom } from "@/components/chat-room";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: Params) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      messages: {
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  const title =
    conversation.type === "GROUP"
      ? conversation.title ?? "Untitled Group"
      : conversation.members.find((m) => m.user.id !== session.user.id)?.user.name ?? "Direct Message";
  const memberNames = conversation.members.map((member) => member.user.name ?? member.user.email).join(", ");
  const headerSubtitle =
    conversation.type === "GROUP"
      ? `${memberNames}${conversation.joinCode ? ` | Join code: ${conversation.joinCode}` : ""}`
      : memberNames;

  return (
    <ChatRoom
      conversationId={conversation.id}
      currentUserId={session.user.id}
      headerTitle={title}
      headerSubtitle={headerSubtitle}
      initialMessages={conversation.messages
        .slice()
        .reverse()
        .map((message) => ({
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          sender: {
            id: message.sender.id,
            name: message.sender.name,
            image: message.sender.image,
          },
        }))}
    />
  );
}
