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
assert.deepEqual(result.cases.map(x => x.ChargeClass), ['O', 'O', 'O']);
assert.equal(result.cases[0].WarrantIssueDate, '10/15/2024');
assert(result.cases.every(x => x.issues.length === 1 && x.issues[0].startsWith('ATTORNEYNAME')));
assert.equal(p.parse('', '').fallback, true);
assert(p.parse('- 210171489: Test - warrant', '').cases[0].issues.some(x => x.startsWith('ELIGIBLENOTES')));
assert(p.parse(summary, notes.replace('inputVO.caseNumber=210171490', 'inputVO.caseNumber=210171489')).cases[2].issues.some(x => x.startsWith('CASELINK')));

for (const [raw, expected, type] of [['Class A Felony','A','Felony'],['B Misdemeanor','B','Misdemeanor'],['Misdemeanor Class C','C','Misdemeanor'],['Class D','D',''],['Unclassified Felony','','Felony'],['Class F Felony','','Felony']]) {
  const item = p.parse(summary, notes.replaceAll('Charge Class: Ordinance','Charge Class: '+raw)).cases[0];
  assert.equal(item.ChargeClass, expected);
  assert.equal(item.ChargeType, type);
  if (!expected) assert(item.issues.some(x=>x.startsWith('CHARGECLASS:')));
}
assert.equal(p.parse(summary, notes.replaceAll('Charge Class: Ordinance','Charge Class: A\nCharge Type: Felony')).cases[0].ChargeType, 'Felony');
for (const [raw, canonical] of [['CITY OF FLORISSANT MUNICIPAL COURT','Florissant'],['St. Louis County Circuit Court','St. Louis County Circuit'],['St Louis City Circuit','St. Louis City Circuit'],['University City Municipal','University City']]) {
  assert.equal(p.parse(summary, notes.replace('Location: City of St. Louis Municipal','Location: '+raw)).cases[0].Jurisdiction, canonical);
}
const unknownCourt = p.parse(summary, notes.replace('Location: City of St. Louis Municipal','Location: Unknown Municipal')).cases[0];
assert.equal(unknownCourt.Jurisdiction, '');
assert(unknownCourt.issues.some(x=>x.startsWith('JURISDICTION:')));
assert(p.parse(summary, notes.replace('Location: City of St. Louis Municipal','Location: Manchester')).cases[0].issues.some(x=>x.includes('sources disagree')));
assert.equal(p.parse('No supported number', 'Some uncertain notes').fallback, true);
assert.equal(p.parse('- 25SL-CR09715-01: Synthetic','').cases[0].CaseNumber,'25SL-CR09715-01');
console.log('eligible-cases-core: passed');
