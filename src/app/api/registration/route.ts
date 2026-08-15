import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { step, sessionId, values } = data;

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error("Missing Google Credentials in .env");
      return NextResponse.json({ error: "Server configuration error: Missing credentials" }, { status: 500 });
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
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

    try {
      await sheet.loadHeaderRow();
    } catch (e: any) {
      if (e.message && e.message.includes('No values in the header row')) {
        await sheet.setHeaderRow(Object.keys(rowData));
      } else {
        throw e;
      }
    }

    const rows = await sheet.getRows();
    const existingRow = rows.find(r => r.get('SessionId') === sessionId);

    if (existingRow) {
      // Update the existing row (handles Step > 1, or Step 1 if they clicked 'Back' and then 'Continue' again)
      existingRow.assign(rowData);
      await existingRow.save();
    } else {
      // Create a new row if it doesn't exist
      try {
        await sheet.addRow(rowData);
      } catch (e: any) {
         if (e.message && e.message.includes('headerValues')) {
           await sheet.setHeaderRow(Object.keys(rowData));
           await sheet.addRow(rowData);
         } else {
           throw e;
         }
      }
    }

    // Step 3 (Final Submission): Add to Perfex CRM Leads
    if (step === 3 && process.env.PERFEX_API_TOKEN) {
      try {
        const description = [
          `Student Name: ${values.studentName || 'N/A'}`,
          `Student Phone: ${values.studentPhone || 'N/A'}`,
          `School: ${values.school || 'N/A'}`,
          `Syllabus: ${values.syllabus || 'N/A'}`,
          `Grade: ${values.grade || 'N/A'}`,
          `Medium: ${values.medium || 'N/A'}`,
          `Subjects: ${(values.subjects || []).join(', ') || 'N/A'}`,
          `Parent Name: ${values.parentName || 'N/A'}`,
          `Parent Phone: ${values.parentPhone || 'N/A'}`,
          `Address: ${values.address || 'N/A'}`,
          `District: ${values.district || 'N/A'}`,
          `Language: ${values.language || 'English'}`
        ].join('\\n');

        const leadData = new URLSearchParams({
          name: values.studentName || 'New Registration',
          phonenumber: values.studentPhone || '',
          assigned: "48",
          status: "12",
          source: "16",
          description: description
        });

        const perfexRes = await fetch('https://crm.edustutor.com/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'authtoken': process.env.PERFEX_API_TOKEN
          },
          body: leadData.toString()
        });

        if (!perfexRes.ok) {
          console.error("Perfex CRM API Error:", await perfexRes.text());
        }
      } catch (crmError) {
        console.error("Failed to push to Perfex CRM:", crmError);
        // We don't throw here to avoid blocking the user if CRM is down
      }
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Google Sheets API Error:", error);
    return NextResponse.json({ error: "Failed to update Google Sheet" }, { status: 500 });
  }
}
