import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      givenName: string | null;
      familyName: string | null;
      jobTitle: string | null;
      department: string | null;
      sections: string[];
    } & DefaultSession["user"];
  }
}
