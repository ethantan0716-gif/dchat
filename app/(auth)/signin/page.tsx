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
        <h1>Start chatting now</h1>
        <p className="muted">Use Google account access for both new and existing users.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/conversations" });
            }}
          >
            <button className="btn" type="submit">
              Sign in
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/conversations" });
            }}
          >
            <button className="btn btn-secondary" type="submit">
              Log in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
