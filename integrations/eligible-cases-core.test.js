const assert = require('node:assert/strict');
const p = require('./eligible-cases-core.js');
const summary = `CITY OF ST. LOUIS MUNICIPAL - (314) 622-3231
- 24S2-MU03086: Peace Disturbance - warrant
FLORISSANT MUNICIPAL - (314) 921-3322
- 210171489: Failed To Register Vehicle - warrant
- 210171490: Expired Driver's License - warrant`;
const notes = ['24S2-MU03086', '210171489', '210171490'].map((n, i) => `${n} – CITY V TEST PERSON
Location: ${i ? 'Florissant Municipal' : 'City of St. Louis Municipal'}
Attorney: - - -
Most Recent Warrant/Summons: ${i ? '12/27/2023' : '10/15/2024'}
Bond Amount: ${i ? '100.00' : '50.00'}
Charge Text: ${['Peace Disturbance', 'Failed To Register Vehicle', "Expired Driver's License"][i]}
Charge Class: Ordinance
CaseNet: https://www.courts.mo.gov/casenet/cases/newHeader.do?inputVO.caseNumber=${n}&inputVO.courtId=CT21#docket`).join('\n\n');
const result = p.parse(summary, notes);
assert.equal(result.fallback, false);
assert.equal(result.cases.length, 3);
assert.deepEqual(result.cases.map(x => x.Jurisdiction), ['City of St. Louis Municipal', 'Florissant', 'Florissant']);
assert.deepEqual(result.cases.map(x => x.BondAmount), [50, 100, 100]);
assert.deepEqual(result.cases.map(x => x.ChargeType), ['Municipal', 'Municipal', 'Municipal']);
assert.equal(result.cases[0].WarrantIssueDate, '10/15/2024');
assert(result.cases.every(x => x.issues.length === 1 && x.issues[0].startsWith('ATTORNEYNAME')));
assert.equal(p.parse('', '').fallback, true);
assert(p.parse('- 210171489: Test - warrant', '').cases[0].issues.some(x => x.startsWith('ELIGIBLENOTES')));
assert(p.parse(summary, notes.replace('inputVO.caseNumber=210171490', 'inputVO.caseNumber=210171489')).cases[2].issues.some(x => x.startsWith('CASELINK')));
console.log('eligible-cases-core: passed');
