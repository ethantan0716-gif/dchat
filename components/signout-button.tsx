import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}
    >
      <button type="submit" className="btn" style={{ width: "100%" }}>
        Sign out
      </button>
    </form>
  );
}