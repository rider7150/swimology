import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    organizationId?: string;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    organizationId?: string;
  }
} 