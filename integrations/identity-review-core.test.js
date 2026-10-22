const assert = require('node:assert/strict');
const match = require('./identity-review-core');

const history = [
  { sourceRef: 'TIC Graveyard:2', first: 'Avery', last: 'Morgan', dob: '2/13/1990', phone: '(314) 555-0101' },
  { sourceRef: 'TIC Graveyard:3', first: 'Avery', last: 'Jones', dob: '1990-02-13', phone: '3145550101' },
  { sourceRef: 'TIC Graveyard:4', first: 'Avery', last: 'Morgan', dob: '1980-02-13', phone: '3145550199' }
];
assert.deepEqual(match.personCandidates({ first: 'Avery', last: 'Morgn', dob: '1990-02-13' }, history)
  .map(x => x.sourceRef), ['TIC Graveyard:2']);
assert.deepEqual(match.personCandidates({ first: 'Avery', last: 'NewLastName', dob: '1990-02-13', phone: '314-555-0101' }, history)
  .map(x => x.sourceRef), ['TIC Graveyard:2', 'TIC Graveyard:3']);
assert.deepEqual(match.personCandidates({ first: 'Avery', last: 'Morgan' }, history), []);
assert.deepEqual(match.caseNumbersInText('250362633, 25SL-CR09715-01 and 25SL-CR09715'),
  ['250362633', '25SL-CR09715-01', '25SL-CR09715']);
const oldCases = [{ sourceRef: 'TIC Graveyard:2', caseNumbers: ['250362633'], court: 'Florissant' }];
assert.equal(match.caseCandidates({ caseNumber: '250362633', court: 'Florissant' }, oldCases)[0].reason,
  'same court and case number');
assert.equal(match.caseCandidates({ caseNumber: '250362633', court: 'St. Ann' }, oldCases)[0].submissionStatus,
  'UNKNOWN - VERIFY');
assert.equal(match.dob('2/30/1990'), '');
console.log('Synthetic identity and case candidate checks passed.');
