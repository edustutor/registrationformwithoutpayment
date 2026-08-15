import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { step, sessionId, values } = data;

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error("Missing Google Credentials in .env");
      return NextResponse.json({ error: "Server configuration error: Missing credentials" }, { status: 500 });
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet('1FowuzQWdn7QyJS6UsiuBH1ukFq8EzFKBsPn57ZJfuiE', serviceAccountAuth);
    await doc.loadInfo();

    // Look for the "Events Signup" sheet specifically, or fallback to the first sheet
    let sheet = doc.sheetsByTitle['Events Signup'];
    if (!sheet) {
      sheet = doc.sheetsByIndex[0];
    }

    const rowData = {
      SessionId: sessionId,
      Timestamp: new Date().toISOString(),
      Language: values.language || "",
      'Student Name': values.studentName || "",
      'Student Phone': values.studentPhone || "",
      School: values.school || "",
      Syllabus: values.syllabus || "",
      Grade: values.grade || "",
      Medium: values.medium || "",
      Subjects: Array.isArray(values.subjects) ? values.subjects.join(", ") : "",
      'Parent Name': values.parentName || "",
      'Parent Phone': values.parentPhone || "",
      Address: values.address || "",
      District: values.district || "",
      Status: step === 3 ? "Completed" : `Step ${step}`,
    };

    if (step === 1) {
      // Step 1: Create a new row
      try {
        await sheet.addRow(rowData);
      } catch (e: any) {
         // If headers are missing, the addRow will fail. 
         // Let's try to set headers if they don't exist
         if (e.message && e.message.includes('headerValues')) {
           await sheet.setHeaderRow(Object.keys(rowData));
           await sheet.addRow(rowData);
         } else {
           throw e;
         }
      }
    } else {
      // Step > 1: Update existing row
      const rows = await sheet.getRows();
      const existingRow = rows.find(r => r.get('SessionId') === sessionId);

      if (existingRow) {
        // Update the row
        existingRow.assign(rowData);
        await existingRow.save();
      } else {
        // Fallback: If row somehow doesn't exist, create it
        await sheet.addRow(rowData);
      }
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Google Sheets API Error:", error);
    return NextResponse.json({ error: "Failed to update Google Sheet" }, { status: 500 });
  }
}
