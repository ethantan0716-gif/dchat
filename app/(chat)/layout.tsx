import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { SignOutButton } from "@/components/signout-button";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <main className="layout-shell">
      <aside className="sidebar">
        <details className="menu-drawer">
          <summary aria-label="Open menu">
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </summary>
          <div className="menu-panel">
            <div>
              <h2>DChat</h2>
              <div className="muted" style={{ marginTop: 4 }}>
                {session.user.name ?? session.user.email}
              </div>
            </div>
            <a href="/conversations" className="btn" style={{ textAlign: "center" }}>
              Home
            </a>
            <ConversationSidebar />
            <SignOutButton />
          </div>
        </details>
      </aside>
      {children}
    </main>
  );
}
