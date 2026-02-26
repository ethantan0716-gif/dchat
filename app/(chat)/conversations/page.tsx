import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { InboxList } from "@/components/inbox-list";
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
              image: true,
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
      {conversations.length === 0 ? (
        <div className="message-list inbox-list">
          <div className="card">
            <h3>No chats yet</h3>
            <p className="muted">Create a chat from the menu to get started.</p>
          </div>
        </div>
      ) : (
        <InboxList conversations={conversations} currentUserId={session.user.id} />
      )}
    </section>
  );
}
