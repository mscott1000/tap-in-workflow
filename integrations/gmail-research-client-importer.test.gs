// Run testTicTuesdayWeek_() inside Apps Script after adding the importer.
// These assertions are independent of Gmail, Sheets, and client records.
function testTicTuesdayWeek_() {
  var samples = [
    ['2026-10-20T17:00:00Z','10/20/2026'], // Tuesday
    ['2026-10-24T18:00:00Z','10/20/2026'], // Saturday
    ['2026-10-27T17:00:00Z','10/27/2026'], // next Tuesday
    ['2026-11-03T18:00:00Z','11/3/2026'],  // DST transition
    ['2027-01-01T18:00:00Z','12/29/2026']  // year boundary
  ];
  samples.forEach(function(sample) {
    var actual = ticTuesdayWeek_(new Date(sample[0]));
    if (actual !== sample[1]) throw Error(sample[0]+' expected '+sample[1]+' got '+actual);
  });
  console.log('TIC Tuesday week tests passed: '+samples.length);
}
