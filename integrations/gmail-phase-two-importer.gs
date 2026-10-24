// Replaces google-intake-form-auto-add in the existing mailbox Apps Script project.
// Existing runIngest triggers continue to use the same handler.
const CONFIG = {
  SHEET_ID: '1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8',
  SHEET_NAME: 'Clients',
  GMAIL_QUERY: 'is:unread subject:"Intake Form -" newer_than:3d',
  TIMEZONE: 'America/Chicago',
  MAX_THREADS_PER_RUN: 50,
  LOCK_WAIT_MS: 10000
};

function runIngest() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_WAIT_MS)) return;
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Clients tab not found');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const required = ['ClientRowID', 'FirstName', 'LastName', 'DOB', 'Phone', 'Email', 'ClientPhase', 'ClientStatus', 'TICWeek'];
    required.forEach(name => {
      if (!headers.includes(name)) throw new Error('Missing Clients column: ' + name);
    });
    const keyIndex = headers.indexOf('ClientRowID');
    const rows = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues() : [];
    const imported = new Set(rows.map(row => String(row[keyIndex])));
    const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, CONFIG.MAX_THREADS_PER_RUN);
    let created = 0;
    let skipped = 0;
    for (const thread of threads) {
      for (const msg of thread.getMessages()) {
        if (!msg.isUnread() || !/^Intake Form\s*-/i.test(msg.getSubject() || '')) continue;
        // The email ID is the persisted row key, so retries cannot append a second row.
        const key = 'gmail_' + msg.getId();
        if (imported.has(key)) { msg.markRead(); continue; }
        const fields = parseIntakeMessage_(msg);
        const fullName = fields.name || String(msg.getSubject()).replace(/^Intake Form\s*-\s*/i, '').trim();
        if (!fullName || (!fields.phone && !fields.email)) { skipped++; continue; }
        const record = buildPhaseTwoClient_(fields, fullName, key, msg.getDate(), new Date());
        const row = headers.map(name => Object.prototype.hasOwnProperty.call(record, name) ? literalSheetValue_(record[name]) : '');
        sheet.appendRow(row);
        SpreadsheetApp.flush();
        imported.add(key);
        msg.markRead();
        created++;
      }
    }
    console.log('Phase 2 intake: created=' + created + ', skipped=' + skipped);
  } finally { lock.releaseLock(); }
}

function buildPhaseTwoClient_(fields, fullName, key, receivedAt, now) {
  const name = splitName_(fullName);
  const date = Utilities.formatDate(receivedAt, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const today = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const notes = [
    fields.warrantCityCounty && 'Warrant location: ' + fields.warrantCityCounty,
    fields.missedCirc && 'Missed court: ' + fields.missedCirc,
    fields.otherQuestions && 'Other questions: ' + fields.otherQuestions
  ].filter(Boolean).join('\n');
  return {
    ClientID: '', ClientRowID: key,
    FirstName: name.first, LastName: name.last, MiddleName: name.middle,
    DOB: fields.dob || '', Phone: formatIntakePhoneNumber_(fields.phone),
    Email: fields.email || '', Address: splitAddressConservative_(fields.address || '').raw,
    ClientPhase: 'Research', ClientStatus: 'Check Cases',
    TICWeek: upcomingTuesday_(today), FirstContactDate: date,
    DateFormSubmitted: date, Race: fields.race || '', Gender: fields.gender || '',
    ReferralSource: fields.heardHow || '', PrimaryContactMethod: fields.email ? 'Email' : 'Phone',
    OnlineForm: 'Yes', Notes: notes
  };
}

function upcomingTuesday_(ymd) {
  const date = new Date(ymd + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + (2 - date.getUTCDay() + 7) % 7);
  return date.toISOString().slice(0, 10);
}

function literalSheetValue_(value) {
  return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value;
}

function setupTriggerOnce() {
  const existing = ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'runIngest');
  if (!existing.length) ScriptApp.newTrigger('runIngest').timeBased().everyMinutes(1).create();
}

// Existing Jotform HTML and plain-text parsers, reused from the original importer.
function parseIntakeMessage_(msg) {
  // 1) Prefer HTML parsing (most reliable for table-based form emails)
  const html = msg.getBody() || '';
  const fromHtml = parseIntakeHtmlBody_(html);

  // If we got at least one core field, trust HTML parse.
  if (fromHtml && (fromHtml.phone || fromHtml.email || fromHtml.name || fromHtml.address || fromHtml.dob)) {
    return fromHtml;
  }

  // 2) Fallback to plain-text parsing
  const plain = msg.getPlainBody() || '';
  return parseIntakeBody_(plain);
}

function parseIntakeHtmlBody_(html) {
  const mapNorm = {}; // normalizedKey -> value

  // Match table rows that have "question" then "value" TDs (your HTML shows these class/id patterns)
  const re = /<td\b[^>]*(?:questionColumn|question_)\b[^>]*>([\s\S]*?)<\/td>\s*<td\b[^>]*(?:valueColumn|value_)\b[^>]*>([\s\S]*?)<\/td>/gi;

  let m;
  while ((m = re.exec(html)) !== null) {
    const qHtml = m[1];
    const vHtml = m[2];

    const q = clean_(stripHtml_(qHtml));
    const v = clean_(stripHtml_(vHtml));

    if (!q) continue;
    if (!v) continue;

    mapNorm[normalizeKey_(q)] = v;
  }

  // Pull core fields using normalized keys
  const name = clean_(mapNorm[normalizeKey_('Your Name')] || '');
  const address = clean_(mapNorm[normalizeKey_('Current Address')] || '');
  const phone = clean_(mapNorm[normalizeKey_('Phone Number')] || '');
  const email = clean_(mapNorm[normalizeKey_('Email Address')] || mapNorm[normalizeKey_('Email')] || '');
  const dobRaw = clean_(mapNorm[normalizeKey_('Date of Birth')] || mapNorm[normalizeKey_('DOB')] || '');

  // Extras for Prep Notes
  const gender = clean_(mapNorm[normalizeKey_('What gender do you identify as?')] || mapNorm[normalizeKey_('What gender do you identify as')] || '');
  const race = clean_(mapNorm[normalizeKey_('What is your race?')] || mapNorm[normalizeKey_('What is your race')] || '');
  const warrantCityCounty = clean_(mapNorm[normalizeKey_('What county or city was the warrant issued in?')] || mapNorm[normalizeKey_('What county or city was the warrant issued in')] || '');
  const heardHow = clean_(mapNorm[normalizeKey_('How did you hear about the Tap In Center')] || '');
  const missedCirc = clean_(mapNorm[normalizeKey_('Please explain the circumstance for the missed court date')] || '');
  const otherQuestions = clean_(
  mapNorm[normalizeKey_('Do you have any other questions for the tap in center?')] ||
  mapNorm[normalizeKey_('Do you have any other questions for the Tap In Center?')] ||
  mapNorm[normalizeKey_('Do you have any other questions for the tap in center')] ||
  ''
);

  return {
    name,
    address,
    phone,
    email,
    dob: normalizeDobNoLeadingZeros_(dobRaw),

    gender,
    race,
    warrantCityCounty,
    heardHow,
    missedCirc,
    otherQuestions
  };
}

function stripHtml_(s) {
  if (!s) return '';
  // Replace <br> with newlines first (optional)
  let out = String(s).replace(/<br\s*\/?>/gi, '\n');

  // Remove tags
  out = out.replace(/<[^>]+>/g, ' ');

  // Decode a few common HTML entities (enough for your data)
  out = out
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  return out.replace(/\s+/g, ' ').trim();
}

function buildPrepNotes_(fields, isPriorClient, existingPrepNotesValue) {
  const chunks = [];

  if (existingPrepNotesValue) chunks.push(existingPrepNotesValue);

  if (fields.warrantCityCounty) chunks.push(fields.warrantCityCounty);
  if (fields.race) chunks.push(fields.race);
  if (fields.gender) chunks.push(fields.gender);
  if (fields.heardHow) chunks.push(fields.heardHow);
  if (fields.missedCirc) chunks.push(fields.missedCirc);
  if (fields.otherQuestions) chunks.push(fields.otherQuestions);

  if (isPriorClient) chunks.push('POSSIBLE PRIOR CLIENT');

  const dedup = [];
  const seen = new Set();
  for (const c of chunks) {
    const v = clean_(c);
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(v);
  }

  return dedup.join(' | ');
}

function findTemplateRow_(sheet, marker, colIndex) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) throw new Error('Sheet is empty');

  const colVals = sheet.getRange(1, colIndex, lastRow, 1).getValues();

  for (let i = 0; i < colVals.length; i++) {
    if (String(colVals[i][0]).trim() === marker) return i + 1; // 1-based row
  }
  throw new Error(`Template row not found. Put "${marker}" in column ${colIndex}.`);
}

function splitAddressConservative_(addr) {
  const input = clean_(addr);
  if (!input) return { raw: '', city: '', state: '', zip: '' };

  const normalizedRaw = normalizeAddressForSheet_(input);
  if (!normalizedRaw) return { raw: '', city: '', state: '', zip: '' };

  const parts = normalizedRaw.split(',').map(p => p.trim()).filter(Boolean);

  let city = '';
  let state = '';
  let zip = '';

  if (parts.length >= 2) {
    city = parts[1];
  }

  if (parts.length >= 3) {
    const stateZip = parts[2];
    const zipMatch = stateZip.match(/\b(\d{5})(?:-\d{4})?\b/);
    const stateMatch = stateZip.match(/\b([A-Z]{2})\b/);

    if (zipMatch) zip = zipMatch[1];
    if (stateMatch) state = stateMatch[1];
  }

  return {
    raw: normalizedRaw,
    city,
    state,
    zip
  };
}

/**
 * Parses the plain body for the few stable fields we need.
 */
function parseIntakeBody_(plain) {
  const text = (plain || '').replace(/\r\n/g, '\n');

  // Keep line structure, but normalize each line
  const rawLines = text
  .split('\n')
  .map(l => l.replace(/\r/g, ''))
  .map(l => l.trim())
  .filter(Boolean);

// Keep both a raw version (with tabs) and a softened version (spaces collapsed)
const lines = rawLines.map(l => l.replace(/[ ]+/g, ' ').trim());

  const mapNorm = {}; // normalizedKey -> value
  const LABELS = INTAKE_LABELS_();

  // 1) Parse "Label: Value"
  for (const line of lines) {
    const m = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (m) {
      mapNorm[normalizeKey_(m[1])] = clean_(m[2]);
    }
  }
  // 1b) Parse "Label<TAB>Value" (very common in form emails)
for (const line of rawLines) {
  const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const key = parts[0];
    const val = parts.slice(1).join(' ').trim();
    mapNorm[normalizeKey_(key)] = clean_(val);
  }
}

  // 2) Parse "Label Value" on same line (works for tab-collapsed lines)
  for (const line of lines) {
    // Heuristic: split on 2+ spaces OR a single space after a known label
    // We'll just try "first chunk is label" by matching known prefixes.
    for (const label of LABELS) {
      const lbl = label.raw;
      if (line === lbl) continue;
      if (line.toLowerCase().startsWith(lbl.toLowerCase() + ' ')) {
        mapNorm[label.norm] = clean_(line.slice(lbl.length));
      }
    }
  }

  // 3) Parse “label line then value next line” fallback
  for (let i = 0; i < lines.length - 1; i++) {
    const k = normalizeKey_(lines[i]);
    const next = clean_(lines[i + 1]);
    if (LABELS.some(x => x.norm === k) && next) {
      // Avoid overwriting if already captured
      if (!mapNorm[k]) mapNorm[k] = next;
      i++;
    }
  }

  // Pull core fields
  const name = clean_(mapNorm[normalizeKey_('Your Name')] || '');
  const address = clean_(mapNorm[normalizeKey_('Current Address')] || '');
  const phone = clean_(mapNorm[normalizeKey_('Phone Number')] || '');
  const email = clean_(mapNorm[normalizeKey_('Email Address')] || '');
  const dobRaw = clean_(mapNorm[normalizeKey_('Date of Birth')] || '');

  // Pull extra fields for Prep Notes
  const gender = clean_(mapNorm[normalizeKey_('What gender do you identify as?')] || '');
  const race = clean_(mapNorm[normalizeKey_('What is your race?')] || '');
  const warrantCityCounty = clean_(mapNorm[normalizeKey_('What county or city was the warrant issued in?')] || '');
  const heardHow = clean_(mapNorm[normalizeKey_('How did you hear about the Tap In Center')] || '');
  const missedCirc = clean_(mapNorm[normalizeKey_('Please explain the circumstance for the missed court date')] || '');

  return {
    name,
    address,
    phone,
    email,
    dob: normalizeDobNoLeadingZeros_(dobRaw),

    otherQuestions: clean_(mapNorm[normalizeKey_('Do you have any other questions for the tap in center?')] || ''),
    // extras
    gender,
    race,
    warrantCityCounty,
    heardHow,
    missedCirc
  };
}

function normalizeKey_(s) {
  return clean_(s)
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // drop punctuation like ? etc
    .replace(/\s+/g, ' ')
    .trim();
}

function INTAKE_LABELS_() {
  const raws = [
    'Your Name',
    'Current Address',
    'Phone Number',
    'Email Address',
    'Date of Birth',
    'What gender do you identify as?',
    'What is your race?',
    'What county or city was the warrant issued in?',
    'How did you hear about the Tap In Center',
    'Please explain the circumstance for the missed court date',
    'Do you have any other questions for the tap in center?'
  ];
  return raws.map(r => ({ raw: r, norm: normalizeKey_(r) }));
}

function looksLikeKey_(s) {
  return /\b(Your Name|Current Address|Phone Number|Email Address|Date of Birth)\b/i.test(s);
}

function clean_(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

/**
 * Normalize a US phone number for the Weekly Call Log.
 * Already-normalized numbers remain unchanged; common separators and an
 * optional leading US country code are accepted. Unrecognized values are
 * preserved so that the ingest does not discard submitted contact details.
 */
function formatIntakePhoneNumber_(phone) {
  const original = clean_(phone);
  if (!original) return '';
  if (/^\(\d{3}\) \d{3}-\d{4}$/.test(original)) return original;

  let digits = original.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (!/^\d{10}$/.test(digits)) return original;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Convert DOB to M-D-YYYY (matching your sheet example like 7-17-1996).
 * Accepts MM-DD-YYYY or MM/DD/YYYY, with/without leading zeros.
 */
function normalizeDobNoLeadingZeros_(dob) {
  if (!dob) return '';
  const m = dob.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return dob;
  const mm = String(Number(m[1])); // strips leading zeros
  const dd = String(Number(m[2]));
  let yyyy = m[3];
  if (yyyy.length === 2) return dob; // Preserve ambiguous two-digit birth years.
  return `${mm}-${dd}-${yyyy}`;
}

function splitName_(full) {
  const parts = clean_(full).split(' ').filter(Boolean);
  if (parts.length === 0) return { first: '', middle: '', last: '' };
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  const last = parts[parts.length - 1];
  const first = parts[0];
  const middle = parts.slice(1, -1).join(' ');
  return { first, middle, last };
}

function dateAtNoonInTimeZone_(dateObj, timeZone) {
  const ymd = Utilities.formatDate(dateObj, timeZone, 'yyyy-MM-dd');
  return new Date(`${ymd}T12:00:00`);
}

function normalizeAddressForSheet_(addr) {
  let text = clean_(addr);
  if (!text) return '';

  // Normalize comma spacing first
  text = text.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();

  const parts = text.split(',').map(p => p.trim()).filter(Boolean);

  let street = '';
  let city = '';
  let state = '';
  let zip = '';

  if (parts.length >= 1) {
    street = toTitleCaseAddressPart_(parts[0]);
  }

  if (parts.length >= 2) {
    city = normalizeCityName_(parts[1]);
  }

  const tail = parts.slice(2).join(' ');
  if (tail) {
    const zipMatch = tail.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) zip = zipMatch[1];

    const stateText = tail.replace(/\b\d{5}(?:-\d{4})?\b/, '').trim();
    state = normalizeStateToken_(stateText);
  }

  // If the source came in as street, city, state, zip in 4 parts
  if (!state && parts.length >= 3) {
    state = normalizeStateToken_(parts[2]);
  }
  if (!zip && parts.length >= 4) {
    const zipMatch = String(parts[3] || '').match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) zip = zipMatch[1];
  }

  const stateZip = [state, zip].filter(Boolean).join(' ');
  return [street, city, stateZip].filter(Boolean).join(', ');
}

function normalizeCityName_(city) {
  const raw = clean_(city).replace(/\./g, '').replace(/\s+/g, ' ');
  if (/^(saint|st)\s+louis$/i.test(raw)) return 'St. Louis';
  return toTitleCaseAddressPart_(city);
}

function normalizeStateToken_(stateText) {
  const s = clean_(stateText).replace(/\./g, '');
  if (!s) return '';

  if (/^missouri$/i.test(s)) return 'MO';
  if (/^[a-z]{2}$/i.test(s)) return s.toUpperCase();

  return toTitleCaseAddressPart_(s);
}

function toTitleCaseAddressPart_(text) {
  const directionals = new Set(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']);
  const keepLower = new Set(['of', 'and', 'the']);

  return clean_(text)
    .toLowerCase()
    .split(/\s+/)
    .map((word, idx) => {
      const stripped = word.replace(/[^a-z0-9]/gi, '');

      if (directionals.has(stripped)) return stripped.toUpperCase();
      if (idx > 0 && keepLower.has(stripped)) return stripped;
      if (/^\d+[a-z]?$/i.test(word)) return word.toUpperCase();

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\bSt\b(?!\.)/g, 'St')
    .replace(/\bMt\b(?!\.)/g, 'Mt');
}
