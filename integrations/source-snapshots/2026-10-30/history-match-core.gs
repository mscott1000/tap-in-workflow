/* Advisory history matching. No merges, eligibility changes, exports or mail writes. */
var TICIdentity = (function () {
  function name(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z]/g, '');
  }

  function aliases(value) {
    var raw = String(value || '');
    var choices = [raw].concat(raw.split(/[,/()[\]]|\baka\b|\bformerly\b/i));
    return Array.from(new Set(choices.map(name).filter(function (s) {
      return !!s && s !== 'jr' && s !== 'sr';
    })));
  }

  function phones(value) {
    var text = String(value === null || value === undefined ? '' : value)
      .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '');
    var re = /(?:^|[^\d])((?:\+?1[\s.\-]*)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.\-]*\d{3}[\s.\-]*\d{4})(?!\d)/g;
    var found = [], match;
    while ((match = re.exec(text)) !== null) {
      var digits = match[1].replace(/\D/g, '');
      if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
      if (digits.length === 10) found.push(digits);
    }
    return Array.from(new Set(found));
  }

  function phone(value) { return phones(value)[0] || ''; }
  function email(value) { return String(value || '').trim().toLowerCase(); }

  function dob(value) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0')].join('-');
    }
    if (typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 100000) {
      return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 10);
    }
    var text = String(value || '').trim();
    var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
    var us = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(text);
    var y = iso ? +iso[1] : us ? +us[3] : 0;
    var m = iso ? +iso[2] : us ? +us[1] : 0;
    var d = iso ? +iso[3] : us ? +us[2] : 0;
    if (y < 1900 || !m || !d || m > 12 || d > 31) return '';
    var check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return '';
    return [y, String(m).padStart(2, '0'), String(d).padStart(2, '0')].join('-');
  }

  function distanceAtMostOne(a, b) {
    if (!a || !b || Math.abs(a.length - b.length) > 1) return false;
    if (a === b) return true;
    var i = 0, j = 0, changes = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++changes > 1) return false;
      if (a.length >= b.length) i++;
      if (b.length >= a.length) j++;
    }
    return changes + (i < a.length || j < b.length ? 1 : 0) <= 1;
  }

  function sameAlias(a, b) {
    return a.some(function (x) { return b.indexOf(x) !== -1; });
  }

  function closeAlias(a, b) {
    return a.some(function (x) {
      return b.some(function (y) {
        return x === y || (x.length >= 4 && y.length >= 4 && distanceAtMostOne(x, y));
      });
    });
  }

  function personCandidates(current, historicalRows) {
    var first = aliases(current.first), last = aliases(current.last);
    var birth = dob(current.dob), contact = phones(current.phone);
    return historicalRows.map(function (row) {
      var oldFirst = aliases(row.first), oldLast = aliases(row.last), oldBirth = dob(row.dob);
      var oldPhones = row.phones || phones(row.phone);
      var samePhone = contact.some(function (p) { return oldPhones.indexOf(p) !== -1; });
      var sameName = sameAlias(first, oldFirst) && sameAlias(last, oldLast);
      var sameDob = !!birth && birth === oldBirth;
      var reasons = [];
      if (sameName && sameDob) reasons.push('First + Last; DOB');
      else if (sameName) reasons.push(oldBirth ? 'First + Last; DOB differs' : 'First + Last; prior DOB not found');
      else if (sameDob && closeAlias(first, oldFirst) && closeAlias(last, oldLast)) {
        reasons.push('Similar First + Last; Same DOB');
      }
      if (samePhone) reasons.push('Phone Number' + (sameDob ? ' and DOB' : ''));
      return reasons.length ? {
        sourceRef: row.sourceRef, sourceTab: row.sourceTab, sourceRow: row.sourceRow,
        sourceToken: row.sourceToken, reasons: reasons, clientId: row.clientId || ''
      } : null;
    }).filter(Boolean);
  }

  // Retain the uploaded script's complete identifiers, suffixes and case-sensitive comparison.
  function caseNumber(value) {
    return String(value || '').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
      .trim().replace(/\s+/g, '');
  }

  function caseNumbersInText(value) {
    var pattern = /(?:^|[^A-Za-z0-9-])([A-Za-z0-9]{4}-[A-Za-z0-9]{7}(?:-[A-Za-z0-9]{2})?|[0-9]{9})(?![A-Za-z0-9-])/g;
    var matches = [], match;
    while ((match = pattern.exec(String(value || ''))) !== null) matches.push(caseNumber(match[1]));
    return Array.from(new Set(matches));
  }

  function supportedCase(value) {
    return /^(?:[A-Za-z0-9]{4}-[A-Za-z0-9]{7}(?:-[A-Za-z0-9]{2})?|[0-9]{9})$/.test(caseNumber(value));
  }

  function caseCandidates(current, historicalRows) {
    var number = caseNumber(current.caseNumber);
    if (!number || !supportedCase(number)) return [];
    return historicalRows.filter(function (row) {
      return (row.caseNumbers || [row.caseNumber]).some(function (n) { return caseNumber(n) === number; });
    }).map(function (row) {
      return {
        sourceRef: row.sourceRef, sourceTab: row.sourceTab, sourceRow: row.sourceRow,
        sourceToken: row.sourceToken,
        reason: row.sourceTab === 'Cases' ? 'Possible repeat from same TICWeek; verify Client' :
          'Case Number found in TIC Graveyard',
        submissionStatus: row.sourceTab === 'Cases' ? 'Duplicate AppSheet Entry' : 'Previously submitted'
      };
    });
  }

  function clientStatus(matches) {
    if (matches.some(function (m) { return m.Decision === 'Confirmed'; })) return 'Repeat Client Confirmed';
    if (matches.some(function (m) { return m.Decision !== 'Dismissed'; })) return 'Match - Awaiting Confirmation';
    return 'No Client Match';
  }

  function caseStatus(matches) {
    var active = matches.filter(function (m) { return m.Decision !== 'Dismissed'; });
    if (active.some(function (m) { return m.SourceTab === 'TIC Graveyard'; })) return 'Match Found - Awaiting Confirmation';
    if (active.some(function (m) { return m.SourceTab === 'Cases'; })) return 'Duplicate AppSheet Entry';
    return 'No Case Match';
  }

  return { name: name, aliases: aliases, phone: phone, phones: phones, email: email, dob: dob,
    personCandidates: personCandidates, caseNumber: caseNumber, supportedCase: supportedCase,
    caseNumbersInText: caseNumbersInText, caseCandidates: caseCandidates,
    clientStatus: clientStatus, caseStatus: caseStatus };
})();
if (typeof module !== 'undefined') module.exports = TICIdentity;

