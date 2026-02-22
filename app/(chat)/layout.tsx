import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { SignOutButton } from "@/components/signout-button";
import { prisma } from "@/lib/prisma";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
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
    orderBy: { updatedAt: "desc" },
  });
  const users = await prisma.user.findMany({
    where: {
      id: {
        not: session.user.id,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <main className="layout-shell">
      <aside className="sidebar">
        <div>
          <h2>DChat</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            {session.user.name ?? session.user.email}
          </div>
        </div>
        <Link href="/conversations" className="btn" style={{ textAlign: "center" }}>
          Home
        </Link>
        <ConversationSidebar currentUserId={session.user.id} conversations={conversations} users={users} />
        <SignOutButton />
      </aside>
      {children}
    </main>
  );
}
