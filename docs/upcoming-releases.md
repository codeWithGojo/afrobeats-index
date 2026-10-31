# Upcoming releases

`/upcoming` and its homepage preview use `data/upcoming-releases.json`. The source
is the connected Google Calendar named **Release-Cal**, not a Spotify integration.
The private calendar is read by the connected-calendar sync; no Google credentials,
calendar account IDs, guests, or personal calendar events are published to the site.
Only recognized music release announcements are imported. Dates are scheduled
dates from that source, not independently verified streaming availability.

## Sync contract

Read the complete Release-Cal events window from today's start in Africa/Lagos
through the same date next year. Follow every `next_page_token` before importing;
an incomplete page, denied access, or request failure must retain the last good
snapshot. The calendar's own cancellations and removed events are reflected by
replacing the snapshot with a successful complete result, including a genuinely
empty calendar.

Write the connector's complete events array and actual retrieval timestamp to a
temporary file **outside the checkout**:

```json
{"checkedAt":"<actual ISO timestamp>","events":[],"next_page_token":null}
```

Then run from the checkout:

```sh
node scripts/sync-release-calendar.cjs /absolute/path/to/calendar-events.json
npm run build
npm test
```

Import recognizes `ARTIST SET TO DROP NEW ALBUM/EP/SINGLE/SONG "TITLE"`
and `ARTIST WILL RELEASE ...` announcements. Unrecognized events are skipped;
review skips rather than inventing an artist, title, or date. A reschedule replaces
the event with the same ID. Cancelled events are removed. The source description
is escaped as plain text. The sync must not modify the source calendar's sharing.

Commit the snapshot and generated pages/reminders to `codeWithGojo/afrobeats-index`
on `main` after checks pass. Its existing Vercel Git deployment publishes the update.
Preserve unrelated edits and chart data. The generated calendar files live under
`release-reminders/` and are rebuilt from the snapshot.

## Visitor behavior

- Initial HTML includes the release list and reminder links without JavaScript.
- The browser reads the same snapshot for artist/title search and release filters.
- Past dates disappear after the WAT date boundary. Today's records say “Due today”.
- A failed snapshot request retains the initial list and shows a saved-data message.
- The source check date is explicit; data older than two days receives a notice.
- Google Calendar opens a prefilled, all-day event for the visitor to save.
- Apple/Outlook `.ics` downloads include a one-day-before alarm, UTF-8 line folding,
  and escaped calendar text. Notification delivery depends on the visitor's app.

This feature adds no Vercel functions, database tables, or runtime credentials.
