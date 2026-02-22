import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ConversationsLandingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
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
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <section className="chat-main">
      <header className="chat-header">
        <div className="chat-header-title">Inbox</div>
        <div className="chat-header-subtitle">Your previous chats</div>
      </header>
      <div className="message-list">
        {conversations.length === 0 ? (
          <div className="card">
            <h3>No chats yet</h3>
            <p className="muted">Create a chat from the sidebar to get started.</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const name =
              conversation.type === "GROUP"
                ? conversation.title ?? "Untitled group"
                : conversation.members.find((m) => m.user.id !== session.user.id)?.user.name ??
                  conversation.members.find((m) => m.user.id !== session.user.id)?.user.email ??
                  "Direct message";
            const preview = conversation.messages[0]?.body ?? "No messages yet";

            return (
              <Link key={conversation.id} href={`/conversations/${conversation.id}`} className="inbox-item">
                <div className="inbox-item-title">{name}</div>
                <div className="inbox-item-preview">{preview}</div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
