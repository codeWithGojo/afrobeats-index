/* The release calendar model is shared by the build, importer and browser. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfriUpcoming = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const zone = 'Africa/Lagos';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateKey = (now = new Date()) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const nextDate = value => new Date(Date.parse(value) + 86400000).toISOString().slice(0,10);
  const prettyDate = (value, options = {day:'numeric',month:'short',year:'numeric'}) => new Intl.DateTimeFormat('en-GB',{...options,timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  const titleCase = value => value === value.toUpperCase() ? value.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).replace(/\b(And|The|Of|In|To)\b/g,(m,_,offset)=>offset ? m.toLowerCase() : m).replace(/Vol\.(\d)/g,'Vol. $1') : value;
  function parseEvent(event) {
    if (!event || event.status === 'cancelled' || !/^[a-zA-Z0-9_-]{1,160}$/.test(event.id || '')) return null;
    const summary = String(event.summary || '').trim();
    const match = summary.match(/^(.+?)\s+(?:SET TO|WILL)\s+(?:DROP|RELEASE)\s+(?:A\s+)?(?:NEW\s+)?(ALBUM|EP|SINGLE|SONG)\s+["“](.+?)["”]\s*$/i);
    if (!match) return null; // Never publish unrelated calendar events or guess a release.
    const start = typeof event.start === 'object' ? event.start?.date || event.start?.dateTime : event.start;
    let date;
    try { date = /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : dateKey(new Date(start)); } catch { return null; }
    if (!validDate(date)) return null;
    const names = {'DJ TUNEZ':'DJ Tunez'};
    return {id:event.id,artist:names[match[1].toUpperCase()] || titleCase(match[1].trim()),title:titleCase(match[3].trim()),type:/song|single/i.test(match[2])?'Single':match[2].toUpperCase()==='EP'?'EP':'Album',date,note:String(event.description || '').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,1200)};
  }
  function normalize(events, checkedAt = new Date().toISOString()) {
    if (!Array.isArray(events) || Number.isNaN(Date.parse(checkedAt))) throw Error('A complete events array and valid checkedAt are required.');
    // Last occurrence wins so a cancelled or rescheduled event replaces its old version.
    const latest = new Map(events.filter(e=>e?.id).map(e=>[e.id,e]));
    const releases = [...latest.values()].map(parseEvent).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)||a.artist.localeCompare(b.artist));
    return {version:1,source:'Release-Cal',timezone:zone,checkedAt,releases};
  }
  function upcoming(snapshot, now = new Date()) {
    const today = dateKey(now);
    return (snapshot.releases || []).filter(r=>validDate(r.date) && r.date >= today && ['Album','EP','Single'].includes(r.type) && /^[a-zA-Z0-9_-]{1,160}$/.test(r.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.artist.localeCompare(b.artist));
  }
  function countdown(date, now = new Date()) {
    const days = Math.round((Date.parse(date)-Date.parse(dateKey(now)))/86400000);
    return days === 0 ? 'Due today' : days === 1 ? 'Tomorrow' : `In ${days} days`;
  }
  function googleUrl(release) {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.search = new URLSearchParams({action:'TEMPLATE',text:`${release.artist} — ${release.title}`,dates:release.date.replaceAll('-','')+'/'+nextDate(release.date).replaceAll('-',''),details:`Scheduled ${release.type.toLowerCase()} release, listed in Release-Cal. Dates may change.\n${release.note}\nhttps://afrobeats-index.vercel.app/upcoming`,ctz:zone}).toString();
    return url.href;
  }
  function ics(release, checkedAt) {
    const text = v => String(v).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Afri Index//Upcoming Releases//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${release.id}@afrobeats-index.vercel.app`,`DTSTAMP:${new Date(checkedAt).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${release.date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${nextDate(release.date).replaceAll('-','')}`,`SUMMARY:${text(release.artist+' — '+release.title)}`,`DESCRIPTION:${text('Scheduled '+release.type.toLowerCase()+' release listed in Release-Cal. Dates may change.\n'+release.note)}`,'URL:https://afrobeats-index.vercel.app/upcoming','TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-P1D',`DESCRIPTION:${text(release.artist+' — '+release.title+' is scheduled for tomorrow.')}`,'END:VALARM','END:VEVENT','END:VCALENDAR'];
    // RFC 5545 folds at 75 UTF-8 octets, without splitting a code point.
    return lines.map(line=>{let result='',part='',bytes=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(bytes+size>75){result+=part+'\r\n';part=' ';bytes=1;}part+=char;bytes+=size;}return result+part;}).join('\r\n')+'\r\n';
  }
  function rowMarkup(r, now, compact = false) {
    return `<article class="release-row${compact?' release-row-compact':''}"><time class="release-date" datetime="${r.date}"><strong>${prettyDate(r.date,{day:'2-digit'})}</strong><span>${prettyDate(r.date,{month:'short'})}</span></time><div class="release-info"><div class="release-meta"><span>${escape(r.type)}</span><span>${escape(countdown(r.date,now))}</span></div><h${compact?'3':'2'}>${escape(r.title)}</h${compact?'3':'2'}><p class="release-artist">${escape(r.artist)}</p>${!compact&&r.note?`<p class="release-note">${escape(r.note)}</p>`:''}</div>${compact?'<a class="release-preview-link" href="/upcoming">View release <span aria-hidden="true">↗</span></a>':`<details class="release-reminder"><summary>Add reminder</summary><div class="release-reminder-options"><a href="${escape(googleUrl(r))}" target="_blank" rel="noopener noreferrer" aria-label="Add ${escape(r.artist+' — '+r.title)} to Google Calendar">Google Calendar <span aria-hidden="true">↗</span></a><a href="/release-reminders/${r.id}.ics" download>Apple / Outlook (.ics)</a><small>The .ics includes a reminder one day before. Google uses your calendar’s notification settings.</small></div></details>`}</article>`;
  }
  function listMarkup(rows, now = new Date(), compact = false) {
    if (!rows.length) return '<div class="releases-empty"><h2>No upcoming releases listed.</h2><p>Check back after the next Release-Cal update.</p><a href="/releases">Explore the 2026 releases</a></div>';
    if (compact) return rows.map(r=>rowMarkup(r,now,true)).join('');
    const months = new Map();
    for (const r of rows) { const month=r.date.slice(0,7);if(!months.has(month))months.set(month,[]);months.get(month).push(r); }
    return [...months].map(([month,items])=>`<section class="release-month" aria-label="${prettyDate(month+'-01',{month:'long',year:'numeric'})}"><h2 class="release-month-title">${prettyDate(month+'-01',{month:'long',year:'numeric'})}</h2>${items.map(r=>rowMarkup(r,now)).join('')}</section>`).join('');
  }
  return {zone,escape,dateKey,prettyDate,validDate,parseEvent,normalize,upcoming,countdown,googleUrl,ics,listMarkup};
});
