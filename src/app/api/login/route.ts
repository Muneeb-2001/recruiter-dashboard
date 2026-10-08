import { NextResponse } from "next/server";
import crypto from "crypto";

const N8N_LOGIN_URL =
  "https://n8n.domingogarcia.info/webhook/candidate-status";

function createSessionToken() {
  const timestamp = Date.now().toString();
  const secret = process.env.ATS_SESSION_SECRET;

  if (!secret) {
    throw new Error("ATS_SESSION_SECRET is not configured.");
  }

  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("base64url");

  return `${timestamp}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 400 }
      );
    }

    const response = await fetch(N8N_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    const data = await response.json();

    if (data.success !== true || data.authenticated !== true) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
        },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken();

    const result = NextResponse.json({
      success: true,
      authenticated: true,
    });

    result.cookies.set("ats_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return result;
  } catch {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Unable to connect to the login service.",
      },
      { status: 500 }
    );
  }
}
