// Input: the COMPLETE, paginated Release-Cal result for the documented time window.
// Only music announcement fields are published; the raw calendar stays outside Git.
const fs = require('node:fs');
const {normalize} = require('../upcoming-releases.js');
const inputPath = process.argv[2];
if (!inputPath) throw Error('Usage: node scripts/sync-release-calendar.cjs /absolute/path/to/calendar-events.json');
const input = JSON.parse(fs.readFileSync(inputPath,'utf8'));
if (input.next_page_token || input.nextPageToken) throw Error('Finish calendar pagination before importing.');
if (!Array.isArray(input.events) || !input.checkedAt) throw Error('Input requires events and the actual checkedAt timestamp.');
const snapshot = normalize(input.events,input.checkedAt);
fs.writeFileSync('data/upcoming-releases.json',JSON.stringify(snapshot,null,2)+'\n');
console.log(`Imported ${snapshot.releases.length} music releases; skipped ${input.events.length-snapshot.releases.length} unrecognized, cancelled or duplicate events.`);
