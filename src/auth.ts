import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isConfiguredOwner } from "@/lib/owner";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] missing credentials");
          return null;
        }
        const email = (credentials.email as string).trim().toLowerCase();
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { organization: true },
          });
          if (!user) {
            console.log("[auth] user not found:", email);
            return null;
          }
          const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!valid) {
            console.log("[auth] password mismatch for:", email);
            return null;
          }
          console.log("[auth] login success:", email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
            organizationStatus: user.organization.status,
          };
        } catch (err: any) {
          console.error("[auth] database error:", err.message);
          return null;
        }
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
      const ownerId = process.env.OWNER_USER_ID?.trim();
      if (!ownerId) {
        console.error("[auth] OWNER_USER_ID is not set. Admin access is disabled.");
      }
      token.isOwner = isConfiguredOwner(token.sub || (user as any)?.id);
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
