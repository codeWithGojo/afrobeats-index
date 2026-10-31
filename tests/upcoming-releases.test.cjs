const {test}=require('node:test'), assert=require('node:assert/strict');
const model=require('../upcoming-releases.js');
const event={id:'release-123',summary:'DJ TUNEZ SET TO DROP NEW EP "IN TUNEZ WE TRUST, VOL.1"',status:'confirmed',start:'2026-11-13T00:00:00+01:00',description:'New music.'};
test('calendar importer reads only release announcements and preserves Lagos dates',()=>{
  const r=model.parseEvent(event);assert.equal(r.artist,'DJ Tunez');assert.equal(r.type,'EP');assert.equal(r.date,'2026-11-13');
  assert.equal(model.parseEvent({...event,status:'cancelled'}),null);
  assert.equal(model.parseEvent({...event,summary:'Private appointment'}),null);
  assert.equal(model.parseEvent({...event,start:{date:'2026-02-30'}}),null);
  assert.equal(model.parseEvent({...event,start:'not a date'}),null);
  assert.equal(model.parseEvent({...event,start:{date:'2026-11-14'}}).date,'2026-11-14');
  assert.equal(model.parseEvent({...event,start:'2026-11-12T23:30:00Z'}).date,'2026-11-13');
  const snapshot=model.normalize([event,{...event,start:'2026-11-15T00:00:00+01:00'}]);
  assert.equal(snapshot.releases.length,1);assert.equal(snapshot.releases[0].date,'2026-11-15');
  assert.equal(model.normalize([event,{id:event.id,status:'cancelled'}]).releases.length,0);
  assert.ok(!JSON.stringify(snapshot).includes('@group.calendar.google.com'));
});
test('upcoming releases roll over at WAT midnight without claiming availability',()=>{
  const snapshot={releases:[model.parseEvent(event)]};
  assert.equal(model.upcoming(snapshot,new Date('2026-11-13T22:59:59Z')).length,1);
  assert.equal(model.upcoming(snapshot,new Date('2026-11-13T23:00:00Z')).length,0);
  assert.equal(model.countdown('2026-11-13',new Date('2026-11-12T23:00:00Z')),'Due today');
  assert.equal(model.countdown('2026-11-13',new Date('2026-11-11T23:00:00Z')),'Tomorrow');
});
test('Google and Apple reminders preserve all-day dates and escape content',()=>{
  const release={...model.parseEvent(event),title:'Song, one; two\nBEGIN:VEVENT',note:'A'.repeat(110)+' 🎵'};
  const url=new URL(model.googleUrl(release));
  assert.equal(url.origin,'https://calendar.google.com');
  assert.equal(url.searchParams.get('dates'),'20261113/20261114');
  assert.equal(url.searchParams.get('ctz'),'Africa/Lagos');
  const output=model.ics(release,'2026-10-31T21:08:00Z');
  assert.ok(output.includes('DTSTART;VALUE=DATE:20261113\r\n'));
  assert.ok(output.includes('TRIGGER:-P1D'));
  assert.equal(output.match(/^BEGIN:VEVENT\r?$/gm).length,1);
  output.split('\r\n').forEach(line=>assert.ok(Buffer.byteLength(line)<=75));
  const html=model.listMarkup([{...release,title:'<script>alert(1)</script>'}],new Date('2026-11-01T00:00:00Z'));
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});
