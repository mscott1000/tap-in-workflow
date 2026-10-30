/* Paste alongside eligible-cases-core.js in the existing standalone Apps Script.
   Called by an AppSheet bot with the selected Clients[ClientRowID].
   Does not submit cases to courts or decide eligibility. */
var TIC_CASES_SPREADSHEET_ID = '1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8';

function createEligibleCasesForClient(clientRowId) {
  if (!clientRowId) throw new Error('Missing ClientRowID');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var created = [], skipped = [];
  try {
    var workbook = SpreadsheetApp.openById(TIC_CASES_SPREADSHEET_ID);
    var clients = workbook.getSheetByName('Clients');
    var cases = workbook.getSheetByName('Cases');
    if (!clients || !cases) throw new Error('Clients or Cases tab missing');
    var ch = clients.getRange(1, 1, 1, clients.getLastColumn()).getDisplayValues()[0];
    var kh = cases.getRange(1, 1, 1, cases.getLastColumn()).getDisplayValues()[0];
    function index(headers, name) {
      var n = headers.indexOf(name);
      if (n < 0) throw new Error('Missing required column: ' + name);
      return n;
    }
    ['ClientRowID', 'ClientID', 'EligibleCases', 'EligibleNotes'].forEach(function (n) { index(ch, n); });
    ['CaseID', 'ClientID', 'ClientRowID', 'Jurisdiction', 'CaseNumber', 'CaseStatus', 'CasePhase', 'ResearchNotes',
      'NumberOfCounts', 'AttorneyName', 'ChargeText', 'WarrantIssueDate', 'ChargeType', 'ChargeClass',
      'BondAmount', 'CaseLink'].forEach(function (n) { index(kh, n); });
    var rows = clients.getLastRow() > 1 ? clients.getRange(2, 1, clients.getLastRow() - 1, ch.length).getDisplayValues() : [];
    var matches = rows.filter(function (r) { return r[index(ch, 'ClientRowID')] === String(clientRowId); });
    if (matches.length !== 1) throw new Error('Expected one matching Clients row, found ' + matches.length);
    var client = matches[0];
    var parsed = TICEligibleCases.parse(client[index(ch, 'EligibleCases')], client[index(ch, 'EligibleNotes')]);
    if (parsed.fallback) return { fallback: true, manualCaseRequired: true,
      message: 'No supported case number found. Open Add Case on this Client row; no row was created.', created: [], skipped: [] };
    // Fail before any append if this project lacks its advisory dependency.
    if (typeof checkCaseHistory !== 'function') throw new Error('Install alongside history-match-core and history-match-adapter in AppSheet Intake before generating Cases.');
    var oldRows = cases.getLastRow() > 1 ? cases.getRange(2, 1, cases.getLastRow() - 1, kh.length).getDisplayValues() : [];
    parsed.cases.forEach(function (item) {
      var existing = oldRows.some(function (r) {
        return r[index(kh, 'ClientRowID')] === String(clientRowId) &&
          r[index(kh, 'CaseNumber')].replace(/\s+/g, '') === item.CaseNumber;
      });
      if (existing) {
        skipped.push(item.CaseNumber + ': already linked to this Client row');
        return;
      }
      var out = Array(kh.length).fill('');
      var id = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
      var values = {
        CaseID: id, ClientID: client[index(ch, 'ClientID')], ClientRowID: String(clientRowId),
        Jurisdiction: item.Jurisdiction, CaseNumber: item.CaseNumber,
        NumberOfCounts: 1, AttorneyName: item.AttorneyName,
        ChargeText: item.ChargeText, WarrantIssueDate: item.WarrantIssueDate,
        ChargeType: item.ChargeType, ChargeClass: item.ChargeClass,
        BondAmount: item.BondAmount, CaseLink: item.CaseLink,
        CaseStatus: 'Ready to Refer', CasePhase: 'Request',
        ResearchNotes: item.issues.length ? 'Review before submission:\n' + item.issues.join('\n') : ''
      };
      Object.keys(values).forEach(function (name) {
        var at = kh.indexOf(name);
        if (at >= 0) out[at] = typeof values[name] === 'string' && /^[=+@-]/.test(values[name]) ? "'" + values[name] : values[name];
      });
      cases.appendRow(out);
      oldRows.push(out);
      created.push({ CaseID: id, CaseNumber: item.CaseNumber, warnings: item.issues });
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  // Sheet writes do not fire an AppSheet add-row bot. Trigger the existing
  // advisory case-number check explicitly after the shared lock is released.
  // One existing history call refreshes all Cases, including retry-skipped rows.
  // A failed check rejects the bot task so a retry can finish without duplicates.
  if (created.length || skipped.length) {
    try { var historyResult = checkCaseHistory(created.length ? created[0].CaseID : oldRows.filter(function (r) {
      return r[index(kh, 'ClientRowID')] === String(clientRowId) &&
        parsed.cases.some(function (item) { return r[index(kh, 'CaseNumber')].replace(/\s+/g, '') === item.CaseNumber; });
    })[0][index(kh, 'CaseID')]);
      if (historyResult && historyResult.sourceError) throw new Error('Historical source is unreadable; case checks report Error.');
    }
    catch (e) { throw new Error('Cases saved; advisory history refresh failed. Retry Generate Cases; existing rows will be skipped. ' + String(e)); }
  }
  return { fallback: false, created: created, skipped: skipped };
}
