import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          organizationStatus: user.organization.status,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.organizationStatus = (user as any).organizationStatus;
      }
      // Always recompute owner flag (user is only present on initial sign-in)
      const ownerId = process.env.OWNER_USER_ID;
      const email = (user as any)?.email || (token as any).email;
      token.isOwner = ownerId
        ? token.sub === ownerId || (user as any)?.id === ownerId
        : email === "admin@equipmentai.com";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).organizationName = token.organizationName;
        (session.user as any).organizationStatus = token.organizationStatus;
        (session.user as any).isOwner = !!token.isOwner;
      }
      return session;
    },
  },
});
