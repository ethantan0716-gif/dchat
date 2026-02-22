import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/conversations");
  }

  return (
    <main className="page-center">
      <section className="card">
        <h1>Welcome to DChat</h1>
        <p className="muted">Sign in with Google to start chatting.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/conversations" });
          }}
        >
          <button className="btn" type="submit">
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}
