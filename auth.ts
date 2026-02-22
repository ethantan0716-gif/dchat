import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      const id = user?.id ?? (typeof token.id === "string" ? token.id : token.sub);
      if (session.user) {
        session.user.id = id ?? "";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isSignedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isAuthRoute = pathname.startsWith("/signin") || pathname.startsWith("/api/auth");

      if (isAuthRoute) {
        return true;
      }

      return isSignedIn;
    },
  },
  pages: {
    signIn: "/signin",
  },
});
