import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_TOKEN = 'process.env.AIRTABLE_API_KEY';
const AIRTABLE_BASE_ID = 'appheOfNyuQlbiOBY';
const AIRTABLE_TABLE_NAME = 'Status Update';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, interviewStatus } = body;

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const table = encodeURIComponent(AIRTABLE_TABLE_NAME);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}/${recordId}`;

    const response = await fetch(url, {
      method: 'process.env.AIRTABLE_API_KEY',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Interview Status': interviewStatus || 'Interview Link Sent',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { success: false, error: `Airtable error: ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating interview status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
