import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const allRows: Record<string, any>[] = [];
    const pageSize = 500;

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("Candidates Status")
        .select("*")
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Supabase candidates query failed:", error.message);

        return NextResponse.json(
          { error: "Unable to load candidates from Supabase." },
          { status: 500 }
        );
      }

      const rows = (data ?? []) as Record<string, any>[];
      allRows.push(...rows);

      if (rows.length < pageSize) {
        break;
      }
    }

    const usedIds = new Set<string>();

    const candidates = allRows.map((fields, index) => {
      const name = fields["Full Name"] ?? fields["full_name"] ?? fields.Name ?? fields.name ?? "";
      const email = fields.Email ?? fields.email ?? "";
      const date = fields.Date ?? fields.date ?? "";

      const baseId = String(
        fields.id ??
        fields.ID ??
        fields.Id ??
        fields.uuid ??
        fields.UUID ??
        email ??
        `${name}-${date}-${index}`
      );

      let candidateId = baseId;
      let duplicateNumber = 1;

      while (usedIds.has(candidateId)) {
        candidateId = `${baseId}-${duplicateNumber++}`;
      }

      usedIds.add(candidateId);

      const score =
        fields.Score ??
        fields["ATS Score"] ??
        fields.atsScore ??
        null;

      const strength =
        fields.Strength ??
        fields.Strengths ??
        fields["Key Strengths"] ??
        "";

      const gap =
        fields.Gap ??
        fields.Gaps ??
        fields.Weaknesses ??
        "";

      return {
        id: candidateId,
        name,
        email,
        area: fields["Position Applied"] ?? fields["position_applied"] ?? fields.Area ?? fields.area ?? "",
        country: fields.Country ?? fields.country ?? "",
        salaryExpectation:
          fields["Salary Expectation (with Currency)"] ??
          fields["Salary Expectation"] ??
          fields.salaryExpectation ??
          fields["Salary Expectations"] ??
          "",
        attachment: fields.Attachment ?? fields.attachment ?? [],
        linkCV: fields["Link CV"] ?? fields["link_cv"] ?? "",
        linkPortfolio: fields["Link Portfolio"] ?? fields["link_portfolio"] ?? "",
        linkLinkedIn: fields["Link LinkedIn"] ?? fields["link_linkedin"] ?? "",
        date,
        status: fields.Status ?? fields.status ?? "",
        interviewStatus:
          fields["Interview Status"] ??
          fields.interviewStatus ??
          "",
        score,
        atsScore: score,
        recommendation:
          fields.Recommendation ?? fields.recommendation ?? "",
        summary: fields.Summary ?? fields.summary ?? "",
        strength,
        strengths: strength,
        gap,
        gaps: gap,
        skills: fields.Skills ?? fields.skills ?? "",
        skillsMatchScore:
          fields["Skills Match Score"] ??
          fields.skillsMatchScore ??
          null,
        skillMatchScore:
          fields["Skills Match Score"] ??
          fields.skillMatchScore ??
          null,
        experience: fields.Experience ?? fields.experience ?? "",
        experienceMatch:
          fields["Experience Match Score"] ??
          fields.experienceMatch ??
          null,
        experienceMatchScore:
          fields["Experience Match Score"] ??
          fields.experienceMatchScore ??
          null,
        languageFitScore:
          fields["Language Fit"] ??
          fields.languageFitScore ??
          null,
        resumeText:
          fields["Resume Text"] ??
          fields.resumeText ??
          "",
        rawFields: fields,
      };
    });

    return NextResponse.json({
      success: true,
      candidates,
      total: candidates.length,
    });
  } catch (error) {
    console.error("Failed to load Supabase candidates:", error);

    return NextResponse.json(
      { error: "Unable to load candidates from Supabase." },
      { status: 500 }
    );
  }
}
const N8N_WEBHOOK_URL = "https://n8n.domingogarcia.info/webhook/a91cd0c0-7a4b-498a-b186-a7785f52eff1";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const cvFile = formData.get("cv");

    if (!name || !email || !area) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, and area are required",
        },
        { status: 400 }
      );
    }

    const token =
      process.env.AIRTABLE_API_KEY ||
      process.env.AIRTABLE_TOKEN;

    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName =
      process.env.AIRTABLE_TABLE_NAME || "Status Update";

    if (!token || !baseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Airtable configuration missing",
        },
        { status: 500 }
      );
    }

    const recordData: Record<string, any> = {
      Name: name,
      Email: email,
      Area: area,
    };

    const table = encodeURIComponent(tableName);

    const airtableResponse = await fetch(
      `${AIRTABLE_API_URL}/${baseId}/${table}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: recordData,
        }),
      }
    );

    const airtableData = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error(
        "Airtable POST error:",
        airtableResponse.status,
        airtableData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            airtableData.error?.message ||
            "Airtable error",
        },
        { status: airtableResponse.status }
      );
    }

    const airtableRecordId = airtableData.id;

    // Upload CV to Airtable Attachment field
    if (cvFile instanceof File && cvFile.size > 0) {
      const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
      const cvBase64 = cvBuffer.toString("base64");

      const attachmentResponse = await fetch(
        `https://content.airtable.com/v0/${baseId}/${airtableRecordId}/Attachment/uploadAttachment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentType: cvFile.type || "application/octet-stream",
            file: cvBase64,
            filename: cvFile.name,
          }),
        }
      );

      if (!attachmentResponse.ok) {
        const attachmentError = await attachmentResponse.text();
        console.error("Airtable CV upload failed:", attachmentError);
        return NextResponse.json(
          {
            success: false,
            error: "Application saved, but CV upload to Airtable failed.",
          },
          { status: 500 }
        );
      }

      console.log("CV uploaded to Airtable:", cvFile.name);
    }
    const timestamp = new Date().toISOString();
    const cvUploaded =
      cvFile instanceof File && cvFile.size > 0;

    const webhookPayload = {
      name,
      email,
      area,
      airtableRecordId,
      timestamp,
      cvUploaded,
      source: "ats-form",
    };

    let webhookResponse: Response;

    try {
      webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });
    } catch (webhookError) {
      console.error(
        "n8n webhook connection error:",
        webhookError
      );

      return NextResponse.json({
        success: true,
        message: "Application saved to Airtable.",
        data: airtableData,
        airtableRecordId,
        webhookSent: false,
        webhookError: "Unable to connect to n8n webhook.",
      });
    }

    const webhookText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error(
        "n8n webhook error:",
        webhookResponse.status,
        webhookText
      );

      return NextResponse.json({
        success: true,
        message: "Application saved to Airtable.",
        data: airtableData,
        airtableRecordId,
        webhookSent: false,
        webhookStatus: webhookResponse.status,
      });
    }

    console.log("n8n webhook payload sent:", webhookPayload);

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      data: airtableData,
      airtableRecordId,
      webhookSent: true,
    });
  } catch (error) {
    console.error("Candidate submission error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
















