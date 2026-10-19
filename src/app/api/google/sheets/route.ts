import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function cellValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object" && "url" in item) {
          return String((item as { url: unknown }).url ?? "");
        }
        return typeof item === "string" ? item : JSON.stringify(item);
      })
      .filter(Boolean)
      .join("\n");
  }

  return JSON.stringify(value);
}

export async function POST(request: NextRequest) {
  try {
    const {
      candidates,
      title,
    }: {
      candidates?: Array<{
        id?: string;
        rawFields?: Record<string, unknown>;
        [key: string]: unknown;
      }>;
      title?: string;
    } = await request.json();

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No candidates were provided for export." },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Sheets authorization is not configured yet. Complete the Google OAuth setup before exporting.",
          authorizationPending: true,
        },
        { status: 503 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Preserve every original Airtable field, including fields not shown in the UI.
    const headers = Array.from(
      new Set([
        "Airtable Record ID",
        ...candidates.flatMap((candidate) =>
          Object.keys(candidate.rawFields ?? {})
        ),
        ...candidates.flatMap((candidate) =>
          Object.keys(candidate).filter(
            (key) => key !== "rawFields" && key !== "id"
          )
        ),
      ])
    );

    const rows = candidates.map((candidate) => {
      const rawFields = candidate.rawFields ?? {};

      return headers.map((header) => {
        if (header === "Airtable Record ID") {
          return cellValue(candidate.id);
        }

        if (Object.prototype.hasOwnProperty.call(rawFields, header)) {
          return cellValue(rawFields[header]);
        }

        return cellValue(candidate[header]);
      });
    });

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title:
            title?.trim() ||
            `ATS Candidates Export ${new Date().toISOString().slice(0, 10)}`,
        },
        sheets: [{ properties: { title: "Candidates" } }],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    if (!spreadsheetId) {
      throw new Error("Google did not return a spreadsheet ID.");
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Candidates!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers, ...rows],
      },
    });

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl:
        spreadsheet.data.spreadsheetUrl ??
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      exportedCount: candidates.length,
    });
  } catch (error) {
    console.error("Google Sheets export failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create the Google Sheet. Check the server logs.",
      },
      { status: 500 }
    );
  }
}
