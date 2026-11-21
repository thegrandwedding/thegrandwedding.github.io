/**
 * Wedding RSVPs — receives RSVPs from thegrandwedding.github.io and adds them to this sheet.
 *
 * Setup (once):
 *   1. In the Google Sheet: Extensions → Apps Script. Replace Code.gs with this file. Save.
 *   2. Deploy → New deployment → type "Web app":
 *        Execute as: Me    ·    Who has access: Anyone
 *   3. Deploy → Authorize access (Advanced → Go to project → Allow).
 *   4. Copy the Web app URL (ends in /exec) into RSVP_URL in assets/js/main.js.
 * After editing this script later: Deploy → Manage deployments → edit → Version: New version.
 */
const SITE = 'https://thegrandwedding.github.io/';
const SHEET_NAME = 'RSVPs';
const EVENTS = ['mehendi', 'varmala', 'sangeet', 'haldi', 'wedding', 'reception'];
const HEADERS = ['Timestamp', 'Invite code', 'Category', 'Name', 'Phone', 'Email',
  'Mehendi', 'Varmala', 'Sangeet', 'Haldi', 'Wedding', 'Reception',
  'Plus-one', 'Plus-one name', 'Message'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const code = String(data.invite || '');
    if (!/^[A-Za-z0-9]{4,32}$/.test(code)) return reply({ ok: false, error: 'Invalid invite' });

    // Check the invite against the live site: this gives the real category and invited events,
    // so neither can be faked from the browser.
    const invite = getInvite(code);
    if (!invite) return reply({ ok: false, error: 'Unknown invite' });
    const name = clean(data.name, 120);
    if (!name) return reply({ ok: false, error: 'Name is required' });

    const attending = data.attending || {};
    const eventCols = EVENTS.map(id =>
      invite.events.indexOf(id) === -1 ? '' : (attending[id] === true ? 'Yes' : attending[id] === false ? 'No' : ''));

    const row = [new Date(), code, invite.group, name, clean(data.phone, 40), clean(data.email, 120)]
      .concat(eventCols)
      .concat([data.plusOne ? 'Yes' : 'No', data.plusOne ? clean(data.plusOneName, 120) : '', clean(data.message, 1000)]);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try { sheet().appendRow(row); } finally { lock.releaseLock(); }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: 'Something went wrong' });
  }
}

function doGet() { return reply({ ok: true, service: 'wedding-rsvp' }); }

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Invite -> { group, events: [ids] }, cached for 6 hours.
function getInvite(code) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('inv_' + code);
  if (hit) return JSON.parse(hit);
  const res = UrlFetchApp.fetch(SITE + 'data/invites/' + code + '.json', { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  const inv = JSON.parse(res.getContentText());
  const ids = (inv.events || []).map(path => {
    const r = UrlFetchApp.fetch(SITE + path, { muteHttpExceptions: true });
    return r.getResponseCode() === 200 ? JSON.parse(r.getContentText()).id : null;
  }).filter(Boolean);
  const out = { group: String(inv.group || ''), events: ids };
  cache.put('inv_' + code, JSON.stringify(out), 21600);
  return out;
}

// Trim, cap length, and stop text from being treated as a spreadsheet formula.
function clean(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
