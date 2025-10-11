import NextAuth from "next-auth";
import { authConfig } from "@qp/api/context";

const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
