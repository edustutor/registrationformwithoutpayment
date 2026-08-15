const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsById[300772715];
    const rows = await sheet.getRows();
    console.log("Total rows in sheet:", rows.length);
    if (rows.length > 0) {
      console.log("Last row:", rows[rows.length - 1].toObject());
    }
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
