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
    console.log("Loading doc...");
    await doc.loadInfo();
    console.log("Loaded doc titled:", doc.title);
    
    let sheet = doc.sheetsById[300772715];
    if (sheet) {
      console.log("Found specific sheet tab:", sheet.title);
    } else {
      console.log("Could not find tab by ID 300772715! Falling back to 0");
      sheet = doc.sheetsByIndex[0];
      console.log("Fallback sheet tab is:", sheet.title);
    }
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
test();
