/* Prototype-only candidate refresher. Requires identity-review-core.js in the
 * same Apps Script project. Set SOURCE_SPREADSHEET_ID and POC_SPREADSHEET_ID in
 * Script Properties; do not install against the operational importer yet.
 * Run manually or on a time-driven trigger. Sheet onEdit is not used.
 */
var TIC_REVIEW = {
  graveyard: 'TIC Graveyard',
  instances: 'ServiceEpisodes',
  cases: 'Cases',
  identities: 'IdentityCandidates',
  caseMatches: 'CaseMatchCandidates'
};

function refreshTICReviewCandidates() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var sourceId = props.getProperty('SOURCE_SPREADSHEET_ID');
    var pocId = props.getProperty('POC_SPREADSHEET_ID');
    if (!sourceId || !pocId) throw new Error('Set both spreadsheet IDs in Script Properties.');

    var source = SpreadsheetApp.openById(sourceId);
    var target = SpreadsheetApp.openById(pocId);
    var graveyard = rowsWithHeaders_(source.getSheetByName(TIC_REVIEW.graveyard));
    var instances = rowsWithHeaders_(target.getSheetByName(TIC_REVIEW.instances));
    var cases = rowsWithHeaders_(target.getSheetByName(TIC_REVIEW.cases));
    var identitySheet = target.getSheetByName(TIC_REVIEW.identities);
    var caseSheet = target.getSheetByName(TIC_REVIEW.caseMatches);
    if (!identitySheet || !caseSheet) throw new Error('Candidate tabs are missing from the prototype.');

    var pastPeople = graveyard.map(function (row) {
      return { sourceRef: TIC_REVIEW.graveyard + ':' + row._sourceRow,
        first: row['First Name'], last: row['Last Name'], dob: row.DOB,
        phone: row['Phone Number'], email: row['Email Address'],
        sourceRow: row._sourceRow };
    });
    var pastCases = [];
    graveyard.forEach(function (row) {
      var numbers = TICIdentity.caseNumbersInText(
        String(row['Eligible Cases'] || '') + '\n' + String(row['Ineligible Cases'] || ''));
      if (numbers.length) pastCases.push({ sourceRef: TIC_REVIEW.graveyard + ':' + row._sourceRow,
        sourceRow: row._sourceRow, caseNumbers: numbers, court: '' });
    });

    var existingIdentity = existingCandidateIds_(identitySheet);
    var identityRows = [];
    instances.forEach(function (row) {
      if (!row.EpisodeID) return;
      TICIdentity.personCandidates({ first: row.FirstName, last: row.LastName,
        dob: row.DOB, phone: row.Phone, email: row.Email }, pastPeople)
        .forEach(function (candidate) {
          var id = candidateId_('person', row.EpisodeID, candidate.sourceRef);
          if (existingIdentity.has(id)) return;
          identityRows.push([id, row.EpisodeID, TIC_REVIEW.graveyard,
            Number(candidate.sourceRef.split(':').pop()), candidate.reasons.join('; '),
            '', 'Pending review', '', '', '']);
          existingIdentity.add(id);
        });
    });

    var existingCase = existingCandidateIds_(caseSheet);
    var caseRows = [];
    cases.forEach(function (row) {
      if (!row.CaseID || !row.CaseNumber) return;
      TICIdentity.caseCandidates({ caseNumber: row.CaseNumber,
        court: row.Jurisdiction }, pastCases).forEach(function (candidate) {
          var id = candidateId_('case', row.CaseID, candidate.sourceRef);
          if (existingCase.has(id)) return;
          caseRows.push([id, row.CaseID, TIC_REVIEW.graveyard,
            Number(candidate.sourceRef.split(':').pop()), candidate.reason,
            candidate.submissionStatus, 'Pending review', '', '', '']);
          existingCase.add(id);
        });
    });

    appendCandidateRows_(identitySheet, identityRows);
    appendCandidateRows_(caseSheet, caseRows);
    // Log counts only. Never log names, DOBs, phones, email addresses or case numbers.
    console.log('Candidate refresh complete: identity=' + identityRows.length +
      ', cases=' + caseRows.length);
  } finally {
    lock.releaseLock();
  }
}

function rowsWithHeaders_(sheet) {
  if (!sheet) throw new Error('Configured sheet tab not found.');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var width = sheet.getLastColumn();
  var data = sheet.getRange(1, 1, lastRow, width).getDisplayValues();
  var headers = data.shift().map(function (value) { return String(value).trim(); });
  return data.map(function (cells, index) {
    var row = { _sourceRow: index + 2 };
    headers.forEach(function (header, col) { if (header) row[header] = cells[col]; });
    return row;
  });
}

function existingCandidateIds_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  return new Set(sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues()
    .map(function (row) { return row[0]; }).filter(Boolean));
}

function candidateId_(kind, rowId, sourceRef) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    kind + '|' + rowId + '|' + sourceRef);
  return kind.toUpperCase() + '-' + bytes.map(function (byte) {
    return ('0' + (byte & 255).toString(16)).slice(-2);
  }).join('').slice(0, 24);
}

function appendCandidateRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
