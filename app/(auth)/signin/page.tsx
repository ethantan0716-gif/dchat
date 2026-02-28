import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/conversations");
  }

  return (
    <main className="auth-shell">
      <div className="auth-showcase" aria-hidden="true">
        <div className="phone-mock phone-home">
          <div className="phone-notch" />
          <div className="phone-screen">
            <div className="phone-topbar">DChat</div>
            <div className="phone-home-grid">
              <div className="phone-home-card">Inbox</div>
              <div className="phone-home-card">Family</div>
              <div className="phone-home-card">Photos</div>
              <div className="phone-home-card">Groups</div>
            </div>
          </div>
        </div>
        <div className="phone-mock phone-inbox">
          <div className="phone-notch" />
          <div className="phone-screen">
            <div className="phone-topbar">Inbox</div>
            <div className="phone-chat-list">
              <div className="phone-chat-row">
                <span className="phone-avatar" />
                <div>
                  <strong>Family Group</strong>
                  <p>Dinner at 7?</p>
                </div>
              </div>
              <div className="phone-chat-row">
                <span className="phone-avatar" />
                <div>
                  <strong>Mom</strong>
                  <p>See you soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="phone-mock phone-chat">
          <div className="phone-notch" />
          <div className="phone-screen">
            <div className="phone-topbar">Chat</div>
            <div className="phone-bubbles">
              <div className="phone-bubble in">Welcome to DChat</div>
              <div className="phone-bubble out">Looks awesome!</div>
              <div className="phone-bubble in">Start chatting now.</div>
            </div>
          </div>
        </div>
        <div className="phone-mock phone-group">
          <div className="phone-notch" />
          <div className="phone-screen">
            <div className="phone-topbar">Group Chat</div>
            <div className="phone-bubbles">
              <div className="phone-bubble in">Ethan: Movie night?</div>
              <div className="phone-bubble in">Mom: Yes, 8pm!</div>
              <div className="phone-bubble out">Great, see you all.</div>
            </div>
          </div>
        </div>
      </div>
      <section className="auth-card">
        <div className="auth-pill">DChat</div>
        <h1>Start chatting now</h1>
        <p className="muted">
          Family updates, group chats, and direct messages in one place. New users can sign in, returning users can
          log in.
        </p>
        <div className="auth-actions">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/conversations" });
            }}
          >
            <button className="btn auth-btn-primary" type="submit">
              Sign in
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/conversations" });
            }}
          >
            <button className="btn btn-secondary auth-btn-secondary" type="submit">
              Log in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
