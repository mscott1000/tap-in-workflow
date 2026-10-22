/* Shared, side-effect-free matching rules for the AppSheet intake adapter.
 * This file contains no case or client data. It is compatible with Apps Script.
 */
var TICIdentity = (function () {
  function name(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z]/g, '');
  }

  function phone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
    return digits.length === 10 ? digits : '';
  }

  function email(value) {
    return String(value || '').trim().toLowerCase();
  }

  function dob(value) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0')].join('-');
    }
    var text = String(value || '').trim();
    var iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
    var us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
    var y = iso ? +iso[1] : us ? +us[3] : 0;
    var m = iso ? +iso[2] : us ? +us[1] : 0;
    var d = iso ? +iso[3] : us ? +us[2] : 0;
    if (!y || !m || !d || m > 12 || d > 31) return '';
    var check = new Date(y, m - 1, d);
    if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return '';
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

  function personCandidates(current, historicalRows) {
    var a = { first: name(current.first), last: name(current.last), dob: dob(current.dob),
      phone: phone(current.phone), email: email(current.email) };
    return historicalRows.map(function (row) {
      var b = { first: name(row.first), last: name(row.last), dob: dob(row.dob),
        phone: phone(row.phone), email: email(row.email) };
      var sameDob = !!a.dob && a.dob === b.dob;
      var samePhone = !!a.phone && a.phone === b.phone;
      var sameEmail = !!a.email && a.email === b.email;
      var sameName = !!a.first && !!a.last && a.first === b.first && a.last === b.last;
      var firstClose = a.first.length >= 4 && b.first.length >= 4 && distanceAtMostOne(a.first, b.first);
      var lastClose = a.last.length >= 4 && b.last.length >= 4 && distanceAtMostOne(a.last, b.last);
      var reasons = [];
      if (sameDob && sameName) reasons.push('same name and DOB');
      if (sameDob && samePhone) reasons.push('same DOB and phone');
      if (sameDob && sameEmail) reasons.push('same DOB and email');
      if (sameDob && firstClose && lastClose && !sameName) reasons.push('similar name and same DOB');
      if (sameName && (samePhone || sameEmail) && !sameDob) reasons.push('same name and contact');
      // Name alone and phone alone are too weak to present as identity evidence.
      return reasons.length ? { sourceRef: row.sourceRef, reasons: reasons,
        clientId: row.clientId || '' } : null;
    }).filter(Boolean);
  }

  function caseNumber(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  }

  function caseNumbersInText(value) {
    var pattern = /(?:^|[^A-Za-z0-9-])([A-Za-z0-9]{4}-[A-Za-z0-9]{7}(?:-[A-Za-z0-9]{2})?|[0-9]{9})(?![A-Za-z0-9-])/g;
    var matches = [], match;
    while ((match = pattern.exec(String(value || ''))) !== null) matches.push(caseNumber(match[1]));
    return Array.from(new Set(matches));
  }

  function caseCandidates(current, historicalRows) {
    var number = caseNumber(current.caseNumber);
    var court = name(current.court);
    if (!number) return [];
    return historicalRows.filter(function (row) {
      return (row.caseNumbers || [row.caseNumber]).some(function (n) { return caseNumber(n) === number; });
    }).map(function (row) {
      var oldCourt = name(row.court);
      return { sourceRef: row.sourceRef,
        reason: court && oldCourt && court === oldCourt ? 'same court and case number' :
          'same case number; court needs review',
        submissionStatus: 'UNKNOWN - VERIFY' };
    });
  }

  return { name: name, phone: phone, email: email, dob: dob,
    personCandidates: personCandidates, caseNumber: caseNumber,
    caseNumbersInText: caseNumbersInText, caseCandidates: caseCandidates };
})();

if (typeof module !== 'undefined') module.exports = TICIdentity;
