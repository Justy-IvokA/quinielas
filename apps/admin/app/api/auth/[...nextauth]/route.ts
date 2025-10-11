import NextAuth from "next-auth";
import { authConfig } from "@qp/api/context";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
