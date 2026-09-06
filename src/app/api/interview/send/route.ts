import { NextRequest, NextResponse } from "next/server";

const INTERVIEW_WEBHOOK_URL =
  "https://n8n.domingogarcia.info/webhook/dc5cd16e-f565-4660-a365-0533087649f3";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { recordId, name, email, area } = body;

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: "Record ID is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Candidate email is required" },
        { status: 400 }
      );
    }

    const webhookResponse = await fetch(INTERVIEW_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recordId,
        name: name || "",
        email,
        area: area || "",
        timestamp: new Date().toISOString(),
        source: "ats-dashboard",
      }),
    });

    const responseText = await webhookResponse.text();

    let webhookData: any;

    try {
      webhookData = responseText ? JSON.parse(responseText) : {};
    } catch {
      webhookData = {
        response: responseText,
      };
    }

    if (!webhookResponse.ok) {
      console.error(
        "Interview n8n webhook error:",
        webhookResponse.status,
        webhookData
      );

      return NextResponse.json(
        {
          success: false,
          error: `Interview webhook returned ${webhookResponse.status}`,
          details: webhookData,
        },
        { status: webhookResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Interview webhook triggered successfully",
      data: webhookData,
    });
  } catch (error) {
    console.error("Interview webhook request failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to trigger interview webhook",
      },
      { status: 500 }
    );
  }
}
