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
    var v = clean(value).toLowerCase().replace(/\bst\./g, 'st').replace(/\s+/g, ' ');
    if (/^(?:city of )?st louis (?:city )?municipal(?: court)?$/.test(v)) return 'City of St. Louis Municipal';
    if (/^st louis county (?:circuit(?: court)?|21st judicial circuit)$/.test(v)) return 'St. Louis County Circuit';
    if (/^(?:st louis city|city of st louis) circuit(?: court)?$/.test(v)) return 'St. Louis City Circuit';
    v = v.replace(/^city of /, '').replace(/ municipal(?: court)?$/, '');
    var cities = ['Florissant', 'Kirkwood', 'Manchester', 'Richmond Heights', 'University City', 'Webster Groves'];
    return cities.filter(function (city) { return city.toLowerCase() === v; })[0] || '';
  }
  function chargeClass(value) {
    var v = clean(value);
    if (/^(?:ordinance|municipal(?: ordinance)?|O)$/i.test(v)) return 'O';
    var m = v.match(/^(?:class\s+)?([A-E])(?:\s+(?:felony|misdemeanor))?$/i) ||
      v.match(/^(?:felony|misdemeanor)\s+(?:class\s+)?([A-E])$/i);
    return m ? m[1].toUpperCase() : '';
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
      else if (/\s+-\s+\(?\d{3}\)?/.test(line)) court = clean(line.split(/\s+-\s+\(?\d{3}/)[0]);
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
        var rawClass = field(block, 'Charge Class');
        var rawType = field(block, 'Charge Type');
        var mappedClass = chargeClass(rawClass || rawType);
        var type = classify(rawType || rawClass);
        if (!type && mappedClass === 'O') type = 'Municipal';
        var bondText = field(block, 'Bond Amount');
        var bond = /^\$?[\d,]+(?:\.\d{1,2})?$/.test(bondText) ? Number(bondText.replace(/[$,]/g, '')) : '';
        var date = field(block, 'Most Recent Warrant/Summons');
        var link = field(block, 'CaseNet');
        var issues = [];
        if (b.length !== 1) issues.push('ELIGIBLECASES: ' + (b.length ? 'case number repeated' : 'case number missing'));
        if (d.length !== 1) issues.push('ELIGIBLENOTES: ' + (d.length ? 'case section repeated' : 'case section missing'));
        if (!jur) issues.push('JURISDICTION: missing or unsupported court: ' + (rawJurisdiction || (b[0] || {}).court || '(blank)'));
        else if (rawJurisdiction && b[0] && b[0].court && jurisdiction(rawJurisdiction) !== jurisdiction(b[0].court)) issues.push('JURISDICTION: sources disagree');
        if (!charge) issues.push('CHARGETEXT: missing');
        if (!mappedClass) issues.push('CHARGECLASS: missing or unsupported: ' + (rawClass || rawType || '(blank)'));
        if (!type) issues.push('CHARGETYPE: missing or unrecognized; verify felony, misdemeanor or municipal');
        if (!date) issues.push('WARRANTISSUEDATE: missing or unspecified');
        if (!bondText || bond === '') issues.push('BONDAMOUNT: missing or unclear');
        if (!link || !/^https:\/\/www\.courts\.mo\.gov\/casenet\//i.test(link) ||
            !link.includes('inputVO.caseNumber=' + number)) issues.push('CASELINK: missing or case number disagrees');
        var attorney = field(block, 'Attorney');
        if (!attorney) issues.push('ATTORNEYNAME: no attorney identified in notes; verify status');
        return {
          CaseNumber: number, Jurisdiction: jur, NumberOfCounts: 1,
          AttorneyName: attorney, ChargeText: charge, WarrantIssueDate: date,
          ChargeType: type, ChargeClass: mappedClass, BondAmount: bond,
          CaseLink: link, issues: issues
        };
      })
    };
  }
  return { parse: parse };
})();
if (typeof module !== 'undefined') module.exports = TICEligibleCases;
