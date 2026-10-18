import NextAuth from "next-auth";

// Lightweight auth config for middleware (no Prisma/bcrypt)
export const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).organizationStatus = token.organizationStatus;
        (session.user as any).isOwner = !!token.isOwner;
      }
      return session;
    },
  },
});
