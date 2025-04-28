import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePasswords } from "@/lib/passwords";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            admin: {
              include: {
                organization: true,
              },
            },
            instructor: {
              include: {
                organization: true,
              },
            },
            parent: {
              include: {
                organization: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await comparePasswords(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Get the organization ID based on the user's role
        let organizationId: string = "";
        if (user.admin) {
          organizationId = user.admin.organization.id;
        } else if (user.instructor) {
          organizationId = user.instructor.organization.id;
        } else if (user.parent) {
          organizationId = user.parent.organization.id;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          organizationId: user.organizationId,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          organizationId: token.organizationId,
        },
      };
    },
  },
}; 