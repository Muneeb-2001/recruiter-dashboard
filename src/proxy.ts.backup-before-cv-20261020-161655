import { NextRequest, NextResponse } from "next/server";

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.ATS_SESSION_SECRET;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) return false;

  const maxAge = 8 * 60 * 60 * 1000;

  if (Date.now() - timestampNumber > maxAge) return false;
  if (Date.now() - timestampNumber < 0) return false;

  try {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    const signatureBytes = Uint8Array.from(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
      (char) => char.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(timestamp)
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = request.cookies.get("ats_session")?.value;
  const validSession = await isValidSession(session);

  if (validSession) {
    return NextResponse.next();
  }

  // API requests must receive JSON 401, not a redirect to the login page.
  if (pathname === "/api/candidates") {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  // Dashboard requests redirect to the login page.
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/candidates"],
};
