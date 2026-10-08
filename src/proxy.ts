import { NextRequest, NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 8;

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createSignature(timestamp: string, secret: string) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp)
  );

  return base64UrlEncode(signature);
}

async function isValidSession(token: string | undefined) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [timestamp, signature] = parts;
  const sessionTime = Number(timestamp);

  if (!Number.isFinite(sessionTime)) {
    return false;
  }

  const age = Date.now() - sessionTime;

  if (age < 0 || age > SESSION_MAX_AGE * 1000) {
    return false;
  }

  const secret = process.env.ATS_SESSION_SECRET;

  if (!secret) {
    return false;
  }

  const expectedSignature = await createSignature(timestamp, secret);

  return signature === expectedSignature;
}

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("ats_session")?.value;

  const valid = await isValidSession(session);

  if (!valid) {
    const loginUrl = new URL("/", request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
