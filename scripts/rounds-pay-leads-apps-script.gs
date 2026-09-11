const SPREADSHEET_ID = '1EmkmzmvIeZ9ZFczMjt1rn_WnCuSeKtnFHSSHqFSU-H4';
const SHEET_NAME = 'Rounds Pay Leads';

const HEADERS = [
  'created_at',
  'source',
  'name',
  'email',
  'practice_name',
  'practice_website',
  'practice_type',
  'state',
  'active_members',
  'membership_fee',
  'billing_frequency',
  'billing_system',
  'accepts_hsa_fsa',
  'biggest_question',
  'notes',
  'page_url',
  'user_agent',
];

function doPost(e) {
  const sheet = getLeadSheet_();
  const params = e && e.parameter ? e.parameter : {};

  sheet.appendRow(
    HEADERS.map((header) => {
      if (header === 'created_at') return new Date();
      return params[header] || '';
    })
  );

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'rounds-pay-leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = currentHeaders.every((value) => !value);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}
