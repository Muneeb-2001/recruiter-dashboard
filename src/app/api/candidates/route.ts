import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function isValidSession(token: string | undefined): boolean {
  if (!token) return false;

  const secret = process.env.ATS_SESSION_SECRET;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;

  // Session expires after 8 hours
  const maxAge = 8 * 60 * 60 * 1000;

  if (Date.now() - timestampNumber > maxAge) {
    return false;
  }

  if (Date.now() - timestampNumber < 0) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("base64url");

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("ats_session")?.value;

  if (!isValidSession(session)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const token =
      process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;

    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = "Status Update";

    if (!token || !baseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Airtable configuration is missing",
        },
        { status: 500 }
      );
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      tableName
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Airtable API error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch candidates",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log(
      `Airtable records fetched: ${data.records?.length || 0}`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Candidates API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
