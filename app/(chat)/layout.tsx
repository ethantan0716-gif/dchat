import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import { auth } from "@/auth";
import { ConversationRail } from "@/components/conversation-rail";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { SignOutButton } from "@/components/signout-button";

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
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="layout-shell">
      <aside className="sidebar">
        <div className="sidebar-topbar">
          <div>
            <h2>DChat</h2>
            <div className="muted" style={{ marginTop: 2 }}>
              {session.user.name ?? session.user.email}
            </div>
          </div>
          <details className="menu-drawer">
            <summary aria-label="Open menu">
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </summary>
            <div className="menu-panel">
              <a href="/conversations" className="btn" style={{ textAlign: "center" }}>
                Home
              </a>
              <ConversationSidebar />
              <SignOutButton />
            </div>
          </details>
        </div>
        <ConversationRail conversations={conversations} currentUserId={session.user.id} />
      </aside>
      {children}
    </main>
  );
}
