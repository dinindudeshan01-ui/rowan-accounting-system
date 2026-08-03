/**
 * ROWAN — DAILY OUTPUT SHEET SYNC
 * ================================
 * Turns a plain Google Sheet into the daily output entry screen for
 * floor staff. They never see Supabase, RLS, or JSON — just columns
 * to fill in. This script pushes new rows to Supabase and pulls a
 * summary back, on a timer (or on demand from the menu).
 *
 * SETUP — do this once, see README.md in this folder for the full
 * walkthrough with screenshots-in-words:
 *   1. Create a Google Sheet with two tabs: "Daily Output" and "Summary".
 *   2. Daily Output headers in row 1, columns A-I exactly in this order:
 *      Date | Department | Style No | Quantity | Notes | Entered By | Status | Row Key | (leave I blank)
 *   3. Extensions > Apps Script, delete the placeholder code, paste this file.
 *   4. Project Settings (gear icon) > Script Properties > add:
 *        SUPABASE_URL       = your project's URL (from .env.local, NEXT_PUBLIC_SUPABASE_URL)
 *        SUPABASE_ANON_KEY  = your anon key (from .env.local, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *   5. Reload the Sheet. A "Rowan Sync" menu appears.
 *   6. Rowan Sync > Refresh Dropdowns (authorize when prompted).
 *   7. Rowan Sync > Enable Auto-Sync (every 10 min).
 *   Done — floor staff just open the Sheet and type.
 *
 * HOW A ROW GETS SYNCED
 *   Fill Date, Department (pick from dropdown), Style No (optional,
 *   dropdown), Quantity, Notes, Entered By. Leave Status and Row Key
 *   blank — the script fills those in. Within 10 minutes (or click
 *   "Sync Now"), Status shows "Synced <time>" in green, or an error
 *   in red explaining exactly what's wrong (e.g. a department name
 *   that doesn't match the dropdown).
 *
 * FIXING A MISTAKE AFTER IT'S SYNCED
 *   Edit the row, then clear the Status cell (delete its contents).
 *   The next sync picks it up again and updates the same record —
 *   it will NOT create a duplicate, because Row Key stays the same.
 *
 * SECURITY NOTE
 *   This uses the same "anon key" the app itself currently uses,
 *   because the app has no login yet (see sql/006_temp_anon_access.sql).
 *   Once you add real login to Rowan, swap this to a dedicated
 *   Supabase Edge Function with its own restricted key instead of
 *   embedding the anon key in Script Properties.
 */

const ENTRY_SHEET = 'Daily Output';
const SUMMARY_SHEET = 'Summary';

// Column indices on the Daily Output sheet (1-based, matches the header order above)
const COL = { DATE: 1, DEPT: 2, STYLE: 3, QTY: 4, NOTES: 5, ENTERED_BY: 6, STATUS: 7, ROW_KEY: 8 };

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------
function config_() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY in Project Settings > Script Properties first.');
  }
  return { url: url.replace(/\/$/, ''), key };
}

function restHeaders_(key) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
}

// ---------------------------------------------------------------
// Menu
// ---------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rowan Sync')
    .addItem('Sync Now', 'syncNow')
    .addItem('Refresh Dropdowns', 'refreshDropdowns')
    .addItem('Refresh Summary', 'refreshSummary')
    .addSeparator()
    .addItem('Enable Auto-Sync (every 10 min)', 'enableAutoSync')
    .addItem('Disable Auto-Sync', 'disableAutoSync')
    .addToUi();
}

// ---------------------------------------------------------------
// Sync Now — push pending rows, write back per-row status
// ---------------------------------------------------------------
function syncNow() {
  const { url, key } = config_();
  const sheet = SpreadsheetApp.getActive().getSheetByName(ENTRY_SHEET);
  if (!sheet) throw new Error(`Sheet tab "${ENTRY_SHEET}" not found.`);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // header only, nothing to do

  const range = sheet.getRange(2, 1, lastRow - 1, 8);
  const values = range.getValues();

  ensureRowKeys_(sheet, values); // fills column H for any row missing it

  const pending = [];
  const pendingRowIndexes = [];
  values.forEach((row, i) => {
    const [date, dept, styleNo, qty, notes, enteredBy, status, rowKey] = row;
    const hasQty = qty !== '' && qty !== null;
    const needsSync = hasQty && (status === '' || String(status).indexOf('Error') === 0);
    if (needsSync) {
      pending.push({
        sheet_row_key: rowKey,
        department: dept,
        style_no: styleNo || null,
        production_date: formatDate_(date),
        quantity: qty,
        notes: notes || '',
        entered_by: enteredBy || '',
      });
      pendingRowIndexes.push(i);
    }
  });

  if (pending.length === 0) return;

  const resp = UrlFetchApp.fetch(`${url}/rest/v1/rpc/sync_department_output`, {
    method: 'post',
    headers: restHeaders_(key),
    payload: JSON.stringify({ p_rows: pending }),
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() >= 300) {
    throw new Error('Sync failed: ' + resp.getContentText());
  }

  const results = JSON.parse(resp.getContentText()); // [{row_key, success, error_message}, ...]
  const resultByKey = {};
  results.forEach((r) => { resultByKey[r.row_key] = r; });

  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, HH:mm');
  pendingRowIndexes.forEach((i) => {
    const rowKey = values[i][7];
    const result = resultByKey[rowKey];
    const sheetRow = i + 2; // +2: 1 for header, 1 for 0-index
    const statusCell = sheet.getRange(sheetRow, COL.STATUS);
    if (result && result.success) {
      statusCell.setValue('Synced ' + now).setBackground('#e6f4ea').setFontColor('#1e7e34');
    } else {
      const msg = result ? result.error_message : 'No response for this row';
      statusCell.setValue('Error: ' + msg).setBackground('#fce8e6').setFontColor('#c5221f');
    }
  });

  refreshSummary_(url, key);
}

// Generates a stable UUID for any row that has a quantity but no Row Key yet.
function ensureRowKeys_(sheet, values) {
  let wrote = false;
  values.forEach((row, i) => {
    const hasQty = row[3] !== '' && row[3] !== null;
    const hasKey = row[7] !== '' && row[7] !== null;
    if (hasQty && !hasKey) {
      const uuid = Utilities.getUuid();
      sheet.getRange(i + 2, COL.ROW_KEY).setValue(uuid);
      values[i][7] = uuid;
      wrote = true;
    }
  });
  if (wrote) SpreadsheetApp.flush();
}

function formatDate_(d) {
  if (Object.prototype.toString.call(d) === '[object Date]') {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return d; // already a string like "2026-07-20"
}

// ---------------------------------------------------------------
// Dropdowns — kept current with whatever departments/styles exist
// in the app right now, so floor staff can't type something wrong.
// ---------------------------------------------------------------
function refreshDropdowns() {
  const { url, key } = config_();
  const sheet = SpreadsheetApp.getActive().getSheetByName(ENTRY_SHEET);
  if (!sheet) throw new Error(`Sheet tab "${ENTRY_SHEET}" not found.`);

  const depts = fetchList_(url, key, 'department_output_dept_list', 'name');
  const styles = fetchList_(url, key, 'department_output_style_list', 'style_no');

  const maxRows = 1000;
  const deptRange = sheet.getRange(2, COL.DEPT, maxRows, 1);
  const styleRange = sheet.getRange(2, COL.STYLE, maxRows, 1);

  deptRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(depts, true).setAllowInvalid(false).build()
  );
  styleRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(styles, true).setAllowInvalid(true).build() // allow blank/typo, server double-checks anyway
  );

  SpreadsheetApp.getActive().toast(`Dropdowns refreshed: ${depts.length} departments, ${styles.length} styles.`);
}

function fetchList_(url, key, view, column) {
  const resp = UrlFetchApp.fetch(`${url}/rest/v1/${view}?select=${column}`, { headers: restHeaders_(key) });
  const data = JSON.parse(resp.getContentText());
  return data.map((row) => row[column]);
}

// ---------------------------------------------------------------
// Summary — the "system → sheet" half. Small, fast, safe to run often.
// ---------------------------------------------------------------
function refreshSummary() {
  const { url, key } = config_();
  refreshSummary_(url, key);
}

function refreshSummary_(url, key) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SUMMARY_SHEET);
  if (!sheet) return; // optional tab; skip quietly if not set up

  const resp = UrlFetchApp.fetch(`${url}/rest/v1/department_output_summary?select=*&order=month.desc,department.asc`, {
    headers: restHeaders_(key),
  });
  const rows = JSON.parse(resp.getContentText());

  sheet.clear();
  sheet.getRange(1, 1, 1, 5).setValues([['Department', 'Month', 'Total Output', 'Entries', 'Last Updated']]).setFontWeight('bold');
  if (rows.length === 0) return;

  const table = rows.map((r) => [
    r.department,
    Utilities.formatDate(new Date(r.month), Session.getScriptTimeZone(), 'MMM yyyy'),
    r.total_output,
    r.entries,
    Utilities.formatDate(new Date(r.last_updated), Session.getScriptTimeZone(), 'MMM d, HH:mm'),
  ]);
  sheet.getRange(2, 1, table.length, 5).setValues(table);
  sheet.autoResizeColumns(1, 5);
}

// ---------------------------------------------------------------
// Auto-sync trigger management
// ---------------------------------------------------------------
function enableAutoSync() {
  disableAutoSync(); // avoid stacking duplicate triggers
  ScriptApp.newTrigger('syncNow').timeBased().everyMinutes(10).create();
  SpreadsheetApp.getActive().toast('Auto-sync enabled: every 10 minutes.');
}

function disableAutoSync() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'syncNow') ScriptApp.deleteTrigger(t);
  });
}
