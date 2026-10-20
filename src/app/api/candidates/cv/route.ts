import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const storagePath = (
      request.nextUrl.searchParams.get("path") || ""
    ).trim();

    if (
      !storagePath ||
      storagePath.length > 1024 ||
      /^https?:\/\//i.test(storagePath) ||
      storagePath.includes("\\") ||
      /[\r\n]/.test(storagePath) ||
      storagePath.split("/").some(
        (part) => !part || part === "." || part === ".."
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid CV storage path." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "CV service is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: file, error } = await supabase.storage
      .from("applicant-cvs")
      .download(storagePath);

    if (error || !file) {
      console.error("Private CV download failed:", error?.message);
      return NextResponse.json(
        { success: false, error: "CV file could not be retrieved." },
        { status: 404 }
      );
    }

    const fileName = storagePath.split("/").pop() || "candidate-cv.pdf";
    const extension = fileName.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    };

    const download = request.nextUrl.searchParams.get("download") === "1";
    const safeFileName = fileName.replace(/["\\\r\n]/g, "_");

    return new NextResponse(Buffer.from(await file.arrayBuffer()), {
      status: 200,
      headers: {
        "Content-Type":
          contentTypes[extension || ""] || "application/octet-stream",
        "Content-Disposition":
          `${download ? "attachment" : "inline"}; filename="${safeFileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("CV endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve candidate CV." },
      { status: 500 }
    );
  }
}
