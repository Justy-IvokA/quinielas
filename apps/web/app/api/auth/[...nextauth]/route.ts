import NextAuth from "next-auth";
import { authConfig } from "@qp/api/context";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

// Wrap handlers to inject correct host into environment
export async function GET(request: NextRequest) {
  const headersList = await headers();
  const host = headersList.get('host');
  
  console.log('[auth-route] GET Request');
  console.log('[auth-route] Host header:', host);
  console.log('[auth-route] Request URL:', request.url);
  
  // CRITICAL FIX: Set AUTH_URL dynamically based on host header
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const authUrl = `${protocol}://${host}`;
    console.log('[auth-route] Setting AUTH_URL to:', authUrl);
    process.env.AUTH_URL = authUrl;
  }
  
  // Create handlers with updated config
  const { handlers } = NextAuth(authConfig);
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const host = headersList.get('host');
  
  console.log('[auth-route] POST Request');
  console.log('[auth-route] Host header:', host);
  console.log('[auth-route] Request URL:', request.url);
  
  // CRITICAL FIX: Set AUTH_URL dynamically based on host header
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const authUrl = `${protocol}://${host}`;
    console.log('[auth-route] Setting AUTH_URL to:', authUrl);
    process.env.AUTH_URL = authUrl;
  }
  
  // Create handlers with updated config
  const { handlers } = NextAuth(authConfig);
  return handlers.POST(request);
}
