/* Parses the existing Clients research fields. Does not decide eligibility. */
var TICEligibleCases = (function () {
  var NUMBER = '(?:[A-Za-z0-9]{4}-[A-Za-z0-9]{7}(?:-[A-Za-z0-9]{2})?|[0-9]{9})';
  var heading = new RegExp('^\\s*(' + NUMBER + ')\\s*[–—-]\\s+.+$', 'm');
  var summaryLine = new RegExp('^\\s*[-•]\\s*(' + NUMBER + ')\\s*:\\s*(.*)$');

  function clean(v) { return String(v == null ? '' : v).trim(); }
  function empty(v) { return !v || /^[-–—\s.]+$/.test(v); }
  function field(block, label) {
    var match = block.match(new RegExp('^\\s*' + label + '\\s*:\\s*(.*)$', 'im'));
    return match && !empty(clean(match[1])) ? clean(match[1]) : '';
  }
  function jurisdiction(value) {
    var v = clean(value);
    if (/^city of st\.? louis municipal$/i.test(v)) return 'City of St. Louis Municipal';
    if (/^(city of )?florissant municipal$/i.test(v)) return 'Florissant';
    return v.replace(/\s+municipal$/i, '').trim();
  }
  function classify(value) {
    if (/^ordinance$/i.test(value)) return 'Municipal';
    if (/misdemeanor/i.test(value)) return 'Misdemeanor';
    if (/felony/i.test(value)) return 'Felony';
    return '';
  }
  function sections(text) {
    var lines = clean(text).split(/\r?\n/), found = [], current = null;
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(heading);
      if (m && lines[i].trim().startsWith(m[1])) {
        if (current) found.push(current);
        current = { number: m[1], lines: [lines[i]] };
      } else if (current) current.lines.push(lines[i]);
    }
    if (current) found.push(current);
    return found.map(function (s) { return { number: s.number, text: s.lines.join('\n') }; });
  }
  function summaries(text) {
    var court = '', found = [];
    clean(text).split(/\r?\n/).forEach(function (line) {
      var m = line.match(summaryLine);
      if (m) found.push({ number: m[1], court: court, charge: clean(m[2]).replace(/\s+-\s+(?:warrant.*|hold.*)$/i, '') });
      else if (/\bMUNICIPAL\b/i.test(line) && /\s+-\s+\(?\d{3}\)?/.test(line)) court = jurisdiction(line.split(/\s+-\s+\(?\d{3}/)[0]);
    });
    return found;
  }
  function parse(eligibleCases, eligibleNotes) {
    var briefs = summaries(eligibleCases), details = sections(eligibleNotes);
    var numbers = [], seen = {};
    briefs.concat(details).forEach(function (x) { if (!seen[x.number]) { seen[x.number] = true; numbers.push(x.number); } });
    return {
      fallback: numbers.length === 0,
      cases: numbers.map(function (number) {
        var b = briefs.filter(function (x) { return x.number === number; });
        var d = details.filter(function (x) { return x.number === number; });
        var block = d.length ? d[0].text : '';
        var rawJurisdiction = field(block, 'Location');
        var jur = jurisdiction(rawJurisdiction || (b[0] || {}).court);
        var charge = field(block, 'Charge (?:Text|Description)') || (b[0] || {}).charge || '';
        var chargeClass = field(block, 'Charge (?:Class|Type)');
        var type = classify(chargeClass);
        var bondText = field(block, 'Bond Amount');
        var bond = /^\$?[\d,]+(?:\.\d{1,2})?$/.test(bondText) ? Number(bondText.replace(/[$,]/g, '')) : '';
        var date = field(block, 'Most Recent Warrant/Summons');
        var link = field(block, 'CaseNet');
        var issues = [];
        if (b.length !== 1) issues.push('ELIGIBLECASES: ' + (b.length ? 'case number repeated' : 'case number missing'));
        if (d.length !== 1) issues.push('ELIGIBLENOTES: ' + (d.length ? 'case section repeated' : 'case section missing'));
        if (!jur) issues.push('JURISDICTION: missing');
        else if (rawJurisdiction && b[0] && b[0].court && jurisdiction(rawJurisdiction).toLowerCase() !== b[0].court.toLowerCase()) issues.push('JURISDICTION: sources disagree');
        if (!charge) issues.push('CHARGETEXT: missing');
        if (!chargeClass) issues.push('CHARGECLASS: missing');
        if (chargeClass && !type) issues.push('CHARGETYPE: unrecognized class');
        if (!date) issues.push('WARRANTISSUEDATE: missing or unspecified');
        if (!bondText || bond === '') issues.push('BONDAMOUNT: missing or unclear');
        if (!link || !/^https:\/\/www\.courts\.mo\.gov\/casenet\//i.test(link) ||
            !link.includes('inputVO.caseNumber=' + number)) issues.push('CASELINK: missing or case number disagrees');
        var attorney = field(block, 'Attorney');
        if (!attorney) issues.push('ATTORNEYNAME: no attorney identified in notes; verify status');
        return {
          CaseNumber: number, Jurisdiction: jur, NumberOfCounts: 1,
          AttorneyName: attorney, ChargeText: charge, WarrantIssueDate: date,
          ChargeType: type, ChargeClass: chargeClass, BondAmount: bond,
          CaseLink: link, issues: issues
        };
      })
    };
  }
  return { parse: parse };
})();

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
    ['CaseID', 'ClientRowID', 'CaseNumber', 'CaseStatus', 'CasePhase', 'ResearchNotes'].forEach(function (n) { index(kh, n); });
    var rows = clients.getLastRow() > 1 ? clients.getRange(2, 1, clients.getLastRow() - 1, ch.length).getDisplayValues() : [];
    var matches = rows.filter(function (r) { return r[index(ch, 'ClientRowID')] === String(clientRowId); });
    if (matches.length !== 1) throw new Error('Expected one matching Clients row, found ' + matches.length);
    var client = matches[0];
    var parsed = TICEligibleCases.parse(client[index(ch, 'EligibleCases')], client[index(ch, 'EligibleNotes')]);
    if (parsed.fallback) return { fallback: true, created: [], skipped: [] };
    var oldRows = cases.getLastRow() > 1 ? cases.getRange(2, 1, cases.getLastRow() - 1, kh.length).getDisplayValues() : [];
    parsed.cases.forEach(function (item) {
      var existing = oldRows.some(function (r) {
        return r[index(kh, 'ClientRowID')] === String(clientRowId) &&
          r[index(kh, 'CaseNumber')].replace(/\s+/g, '') === item.CaseNumber;
      });
      if (existing) { skipped.push(item.CaseNumber + ': already linked to this Client row'); return; }
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
        if (at >= 0) out[at] = values[name];
      });
      cases.appendRow(out);
      oldRows.push(out);
      created.push({ CaseID: id, CaseNumber: item.CaseNumber, warnings: item.issues });
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  // Sheet writes do not fire an AppSheet add-row bot. Trigger the existing
  // advisory case-number check explicitly, once per new CaseID.
  created.forEach(function (entry) {
    if (typeof checkCaseHistory !== 'function') {
      entry.checkError = 'checkCaseHistory is unavailable; repeat-case result remains Pending';
      return;
    }
    try { checkCaseHistory(entry.CaseID); }
    catch (e) { entry.checkError = String(e); }
  });
  return { fallback: false, created: created, skipped: skipped };
}
