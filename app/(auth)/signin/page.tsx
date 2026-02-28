import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/conversations");
  }

  return (
    <main className="auth-shell">
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
