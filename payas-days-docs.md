# Payas Days — Documentation

> Privacy-first browser calendar · No server · Open Source  
> Developer: **Saman Wijesinghe** · License: MIT

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start](#2-quick-start)
3. [Calendar Views](#3-calendar-views)
4. [Event Management](#4-event-management)
5. [User Interface Guide](#5-user-interface-guide)
6. [Settings Reference](#6-settings-reference)
7. [Keyboard Shortcuts](#7-keyboard-shortcuts)
8. [Storage & Data](#8-storage--data)
9. [Architecture & Code Structure](#9-architecture--code-structure)
10. [CSS Design System](#10-css-design-system)
11. [JavaScript API Reference](#11-javascript-api-reference)
12. [Data Structures](#12-data-structures)
13. [Contributing](#13-contributing)
14. [License](#14-license)

---

## 1. Project Overview

**Payas Days** is a fully client-side web calendar that runs entirely in your browser with no server, no account, and no build step. Open `payas-days/index.html` and start scheduling immediately. All data is stored locally using IndexedDB and can be exported as standard ICS or portable Markdown files.

### Key Facts

| Property | Value |
|---|---|
| Entry point | `payas-days/index.html` |
| Stack | HTML5 · CSS3 · Vanilla JS (ES2022) |
| Dependencies | Bootstrap 5.3 · Font Awesome 6.5 · Google Fonts |
| Storage | IndexedDB (persistent) · ICS & Markdown export/import |
| Views | Month · Week · Day · Agenda |
| Browser support | Chromium-based · Firefox |
| Theme | Light and Dark mode (system preference aware) |
| Responsive | Desktop and mobile |

### Design Language

Payas Days follows the **Payas design system** shared across all Payas web tools (Reader, Editor, Player, Imager, FM, Omi). It uses the same colour tokens, typography, and component patterns.

---

## 2. Quick Start

No build or server needed. Just open the entry file:

```bash
# Option 1 — open directly
xdg-open payas-days/index.html          # Linux
open payas-days/index.html              # macOS
start payas-days/index.html             # Windows

# Option 2 — serve locally (avoids file:// quirks)
npx serve .
python3 -m http.server 8080
```

Then navigate to `http://localhost:8080/payas-days/index.html`.

### First Use

1. Open `payas-days/index.html` in your browser.
2. Two sample events are automatically created for today and tomorrow.
3. Click the **+** floating button (bottom-right) to add a new event.
4. Click any day cell in Month view to create an event on that day.
5. Click any event chip to open a quick-detail popover with edit and delete actions.

---

## 3. Calendar Views

Switch between views using the tab bar below the header.

### Month View

Displays a full calendar grid for the current month. Each cell shows up to 3 event chips. If more events fall on a day, a **+N more** indicator appears. Days from adjacent months are shown in a muted style. Today's cell is highlighted.

- Click a day cell → opens the new event modal pre-filled with that date.
- Click an event chip → opens the event detail popover.
- Navigate: `←` / `→` arrows move one month at a time.

### Week View

Displays all 7 days of the current week on a time grid (24-hour vertical axis). Each day is a column; events are positioned and sized by their actual start/end times (minimum height: 15 minutes). A red **now line** marks the current time on today's column.

- The view automatically scrolls to 8 AM on load.
- Click a day header → navigates to that day in Day view.
- Navigate: `←` / `→` arrows move one week at a time.

### Day View

Displays a single day on a time grid identical to the Week view column. Shows the full date in a heading. The now line appears when viewing today.

- Navigate: `←` / `→` arrows move one day at a time.

### Agenda View

Displays events grouped by date for the next **30 days** from the current date. Each group shows the day heading followed by events listing their time range and location. Empty ranges show a placeholder message.

- Navigate: `←` / `→` arrows move 30 days at a time.
- Events are sorted chronologically within each day group.

---

## 4. Event Management

### Creating Events

- **FAB button** (floating `+`) — opens a blank event modal defaulting to the current time (rounded to the hour, duration 1 hour).
- **Day cell click** (Month view) — opens a blank modal pre-filled with the clicked date.
- **Day header click** (Week view) — navigates to Day view for that date.

### Event Fields

| Field | Notes |
|---|---|
| **Title** | Required. Plain text. |
| **All day** | Toggle switch. Switches date inputs to date-only pickers. |
| **Start / End** | `datetime-local` inputs (or `date`-only when All day is on). |
| **Description** | Multi-line textarea. Supports Markdown (stored as-is). |
| **Location** | Free text or URL. Shown in popovers and Agenda rows. |
| **Timezone** | Dropdown populated from `Intl.supportedValuesOf('timeZone')`. Defaults to local timezone. |
| **Color** | Colour swatch picker (10 options). Used for event chips and popover dot. |
| **Label** | Free text tag (e.g. `work`, `personal`). Searchable. |
| **Recurrence** | Preset dropdown + optional raw RRULE text input. |
| **Reminders** | One or more minute offsets before event start. Fires browser notifications. |
| **Attendees** | One or more email addresses added as chips. |
| **Attachments** | One or more URLs added as chips. |

### Editing & Deleting

Click an event → popover appears with **Edit** (pencil) and **Delete** (trash) buttons.

- **Edit** opens the full event modal pre-filled.
- Inside the edit modal, **Export .md** downloads the event as a single Markdown file.
- **Delete** asks for confirmation before removing from IndexedDB.

### Conflict Detection

When saving an event, Payas Days checks whether it overlaps any existing timed (non–all-day) events. If conflicts are found, a confirmation dialog lists the conflicting event titles and lets you save anyway or cancel.

### Recurrence

Supported RRULE presets:

| Label | RRULE value |
|---|---|
| Does not repeat | *(empty)* |
| Daily | `FREQ=DAILY` |
| Weekly | `FREQ=WEEKLY` |
| Every weekday (Mon–Fri) | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| Monthly | `FREQ=MONTHLY` |
| Yearly | `FREQ=YEARLY` |
| Custom… | Raw RRULE string (free input) |

Recurring events are **expanded on the fly** for each view's date range. Each occurrence is a virtual event object with a composite `id` (`masterId_YYYY-MM-DD`) and a `_masterId` back-reference. Editing or deleting always targets the master event.

Supported RRULE parts: `FREQ`, `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`.  
Maximum occurrences expanded per query: 500.

### Reminders

When the browser grants notification permission, Payas Days schedules a `setTimeout` for each reminder offset. On page load, `scheduleAllReminders()` re-registers timers for all events. Notifications are fired via the Web Notifications API with the event title and minutes-before value in the body.

---

## 5. User Interface Guide

### Header

```
[ 📅 Payas Days  Calendar ]   [ ← Apr 2026 → ]   [ 🔍 ]  [ 🌙 ]  [ Settings ]  [ About ]  [ License ]
```

| Element | Action |
|---|---|
| **Payas Days** brand | Click to return to calendar view from a page (Settings/About/License). |
| **← / →** arrows | Navigate backward/forward within the current view's time unit. |
| **Date display** (center) | Shows current period label. Click to jump to today. |
| **🔍 Search** | Toggles the inline search bar. Also opens with `/` key. |
| **🌙 / ☀️ Theme** | Toggles dark/light mode. Persisted to IndexedDB. |
| **Settings / About / License** | Opens the corresponding page, hiding the calendar. |
| **Hamburger** (mobile) | Slides down the mobile navigation menu. |

### Tab Bar

```
[ Month ]  [ Week ]  [ Day ]  [ Agenda ]                               [ Today ]
```

- View buttons are role=tab with aria-selected for accessibility.
- **Today** pill on the right jumps the view to the current date.

### Search Bar

Slides down below the header when activated. Searches across `title`, `description`, `location`, and `label` of all events (case-insensitive, debounced 200 ms). Up to 20 results are shown. Clicking a result navigates to Day view for that event's date and opens its popover.

Close with the `✕` button, the `Escape` key, or by clicking the search icon again.

### Event Detail Popover

A small floating card anchored near the clicked event chip. Shows:

- Colour dot + event title
- Date and time range (or "All day")
- Location (if set)
- Recurrence rule (if set)
- Description preview (first 120 characters)
- Label (if set)

Buttons: **Edit** · **Delete** · **Close (✕)**. Closes automatically when clicking outside.

### FAB (Floating Action Button)

Fixed `+` button in the bottom-right corner. Always visible over the calendar. Opens the new event modal.

---

## 6. Settings Reference

Access via the **Settings** nav link.

### Appearance

| Setting | Options | Description |
|---|---|---|
| Theme | Light / Dark | Applies theme and persists to IndexedDB. |

### Notifications

| Action | Description |
|---|---|
| **Enable** | Calls `Notification.requestPermission()`. Button updates to show granted/denied state. |

### Import & Export

| Action | Description |
|---|---|
| **Export ICS** | Downloads all events as `payas-days.ics` (RFC 5545 / iCalendar). Compatible with Google Calendar, Outlook, Apple Calendar. |
| **Export Markdown bundle** | Downloads all events as a single `payas-days-events.md` file. Each event is a fenced block preceded by `# FILE: <id>.md`. |
| **Import ICS** | File picker (`.ics`). Parses and saves all `VEVENT` blocks. Supports drag-and-drop. |
| **Import Markdown events** | File picker (`.md`, multiple files). Parses YAML front-matter and body. Supports drag-and-drop. |

### Danger Zone

| Action | Description |
|---|---|
| **Clear all** | Deletes every event from IndexedDB. Requires `confirm()` dialog. Cannot be undone. |

---

## 7. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `←` Arrow | Navigate backward (previous month/week/day/30 days) |
| `→` Arrow | Navigate forward |
| `T` | Jump to today |
| `/` | Open search bar |
| `Escape` | Close search bar |

> Shortcuts are suppressed when focus is inside an `input`, `textarea`, `select`, or `[contenteditable]` element.

---

## 8. Storage & Data

### IndexedDB

All data is stored in an IndexedDB database named `payas-days` (version 1) with two object stores:

| Store | Key | Indexes | Purpose |
|---|---|---|---|
| `events` | `id` (string) | `start`, `label` | Event records |
| `settings` | `key` (string) | — | App settings (theme, seeded flag) |

### Event IDs

New events are assigned an ID of the form:

```
evt-<timestamp>-<5-char-random>
```

e.g. `evt-1745200000000-a3k9f`

### Markdown Format

Each event serialises to a Markdown file with YAML front-matter:

```markdown
---
id: evt-1745200000000-a3k9f
title: Team Meeting
start: 2026-04-20T14:00:00
end: 2026-04-20T15:30:00
allDay: false
timezone: Asia/Colombo
location: Conference Room A
attendees:
  - alice@example.com
color: teal
label: work
recurrence: FREQ=WEEKLY;BYDAY=MO
reminders:
  - 10
attachments: []
created: 2026-04-19T08:00:00.000Z
modified: 2026-04-19T08:00:00.000Z
---

Weekly sync with the team.
```

The `description` field is the Markdown body below the closing `---` delimiter.

### ICS Format

Exported ICS follows RFC 5545. Attendees are written as `ATTENDEE:mailto:<email>`. Reminders become `VALARM` blocks with `TRIGGER:-PT<N>M`. Lines are folded at 75 characters.

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Payas Days//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:evt-1745200000000-a3k9f@payas-days
SUMMARY:Team Meeting
DTSTART:20260420T140000
DTEND:20260420T153000
LOCATION:Conference Room A
RRULE:FREQ=WEEKLY;BYDAY=MO
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT10M
END:VALARM
END:VEVENT
END:VCALENDAR
```

---

## 9. Architecture & Code Structure

Payas Days is a **multi-file static web app** with no build step and no framework.

```
payas-days/
├── index.html          — markup: header, tab bar, view containers, modals, FAB
├── css/
│   └── styles.css      — all CSS (~600+ lines, Payas design tokens)
├── js/
│   ├── storage.js      — IndexedDB adapter, Markdown serialisation
│   ├── recurrence.js   — RRULE expander (DAILY/WEEKLY/MONTHLY/YEARLY)
│   ├── ics.js          — ICS (RFC 5545) import & export
│   ├── events.js       — CRUD cache, conflict detection, reminders
│   ├── calendar.js     — Month/Week/Day/Agenda renderers
│   └── app.js          — wiring: theme, nav, form, search, popover, init
└── data/               — (reserved for future local data files)
```

Scripts are loaded in dependency order at the bottom of `index.html`:

```
storage.js → recurrence.js → ics.js → events.js → calendar.js → app.js
```

`app.js` wraps its entire body in an `async IIFE` and awaits `Storage.open()` before initialising anything else.

### Module Pattern

Each JS file exposes a single `const` namespace object (e.g. `Storage`, `Recurrence`, `ICS`, `Events`, `Calendar`). All internal functions and state are private via closures. There is no bundler and no ES module imports — the globals are loaded sequentially via `<script>` tags.

### Page System

Settings, About, and License are rendered as HTML strings injected into `#pageView`. The calendar views (`#calendarView`) are hidden/shown by toggling Bootstrap's `d-none` class. `showCalendarView()` and `showPage(name)` handle the switch.

### Rendering Model

The calendar uses **imperative DOM rendering**: on each navigation or state change, the relevant `render*()` function clears the container and rebuilds it from scratch.

| Function | What it rebuilds |
|---|---|
| `renderMonth()` | 5–6 week grid with event chips |
| `renderWeek()` | 7-column time grid with positioned event blocks |
| `renderDay()` | Single-column time grid |
| `renderAgenda()` | Date-grouped event list for next 30 days |

Week and Day views scroll to 8 AM (480 px from top, 1 px/minute scale) after render via a 50 ms `setTimeout`.

---

## 10. CSS Design System

Payas Days uses the shared **Payas design token set** as CSS custom properties on `:root`.

### Colour Tokens

#### Light Mode (default)

| Token | Value | Usage |
|---|---|---|
| `--bg-app` | `#eeeae2` | Page background |
| `--bg-bar` | `#ffffff` | Header, modal backgrounds |
| `--bg-sidebar` | `#f5f2eb` | Modal headers/footers |
| `--bg-chip` | `#f0ece3` | Input, chip backgrounds |
| `--bg-hover` | `#e8e4db` | Button hover state |
| `--bg-active` | `#dedad1` | Pressed/active state |
| `--text-1` | `#181816` | Primary text |
| `--text-2` | `#52504a` | Secondary text |
| `--text-3` | `#90907e` | Labels, muted text |
| `--border` | `#dbd7ce` | Borders, dividers |
| `--accent` | `#2d6a4f` | Forest green — primary accent |
| `--accent-lt` | `#52b788` | Light green |
| `--accent-dk` | `#1b4332` | Dark green (hover on accent) |
| `--accent-dim` | `rgba(45,106,79,.12)` | Active background tint |
| `--shadow` | `0 1px 5px rgba(0,0,0,.07)` | Subtle elevation |
| `--shadow-lg` | `0 16px 56px rgba(0,0,0,.14)` | Modal/popover elevation |

#### Dark Mode (`[data-theme="dark"]`)

| Token | Value |
|---|---|
| `--bg-app` | `#0f0f0e` |
| `--bg-bar` | `#191917` |
| `--bg-sidebar` | `#141412` |
| `--text-1` | `#e8e4d6` |
| `--text-2` | `#a4a099` |
| `--accent` | `#52b788` |
| `--border` | `#2a2a28` |

### Typography

| Usage | Font | Size | Weight |
|---|---|---|---|
| UI body text | DM Sans | 13–14px | 400–500 |
| Brand / logo | Fraunces (serif) | 15px | 600 |
| Brand sub-label | Fraunces italic | 11px | 400 |
| Numbers / mono | JetBrains Mono | 10–11px | 400–500 |

### Event Colour Palette

| Name | Hex |
|---|---|
| `blue` | `#2383e2` |
| `teal` | `#0d9488` |
| `green` | `#16a34a` |
| `yellow` | `#ca8a04` |
| `orange` | `#ea580c` |
| `red` | `#dc2626` |
| `pink` | `#db2777` |
| `purple` | `#9333ea` |
| `gray` | `#6b7280` |
| `indigo` | `#4f46e5` |

---

## 11. JavaScript API Reference

### Storage

| Function | Signature | Description |
|---|---|---|
| `open()` | `→ Promise<IDBDatabase>` | Opens (or returns cached) the IndexedDB database. Called once on app init. |
| `getAllEvents()` | `→ Promise<Event[]>` | Returns all event records from the `events` store. |
| `getEvent(id)` | `(string) → Promise<Event>` | Returns a single event by ID. |
| `saveEvent(event)` | `(Event) → Promise` | Upserts an event. Generates `id`, `created`, `modified` if missing. |
| `deleteEvent(id)` | `(string) → Promise` | Deletes event by ID. |
| `clearAllEvents()` | `→ Promise` | Clears the entire `events` store. |
| `getSetting(key, fallback)` | `(string, any) → Promise<any>` | Reads a setting value; returns `fallback` if not found. |
| `setSetting(key, value)` | `(string, any) → Promise` | Writes a setting value. |
| `eventToMarkdown(ev)` | `(Event) → string` | Serialises an event to a Markdown string with YAML front-matter. |
| `markdownToEvent(md)` | `(string) → Event\|null` | Parses a Markdown string back to an event object. Returns `null` on parse failure. |
| `exportAllMarkdown()` | `→ Promise<{name,content}[]>` | Returns an array of `{ name: '<id>.md', content }` for every stored event. |
| `importMarkdownFiles(files)` | `({name,content}[]) → Promise<Event[]>` | Parses and saves an array of Markdown file objects. Returns saved events. |

### Events

| Function | Signature | Description |
|---|---|---|
| `load()` | `→ Promise<Event[]>` | Loads all events from Storage into the in-memory cache. |
| `save(ev)` | `(Event) → Promise<Event>` | Saves event to Storage, reloads cache, schedules reminders. |
| `remove(id)` | `(string) → Promise` | Deletes event from Storage and removes from cache. |
| `getAll()` | `→ Event[]` | Returns the in-memory cache array. |
| `getById(id)` | `(string) → Event\|undefined` | Finds event in cache by ID. |
| `getInRange(start, end)` | `(Date, Date) → Event[]` | Returns events (including recurrence expansions) overlapping the range. |
| `search(query)` | `(string) → Event[]` | Case-insensitive search across title, description, location, label. |
| `detectConflicts(ev)` | `(Event) → Event[]` | Returns existing events whose time overlaps with the given event. Skips all-day events. |
| `scheduleAllReminders()` | `→ Promise` | Requests notification permission if needed, then schedules timers for all events. |
| `colorHex(name)` | `(string) → string` | Returns the hex colour for a colour name. Falls back to `EVENT_COLORS.blue`. |
| `EVENT_COLORS` | `Object` | Map of colour name → hex string (10 colours). |

### Calendar

| Function | Signature | Description |
|---|---|---|
| `setDate(d)` | `(Date) → void` | Sets the current navigation date. |
| `getDate()` | `→ Date` | Returns a copy of the current date. |
| `setView(v)` | `('month'\|'week'\|'day'\|'agenda') → void` | Sets the active view. |
| `getView()` | `→ string` | Returns the current view name. |
| `navigate(dir)` | `(1\|-1) → void` | Moves forward or backward by the view's time unit. |
| `titleLabel()` | `→ string` | Returns the header date string for the current view and date. |
| `render()` | `→ void` | Shows the active view container and calls the appropriate render function. |
| `on(eventType, fn)` | `(string, Function) → void` | Registers a callback for `'eventClick'` or `'dayClick'`. |
| `fmtTime(iso)` | `(string) → string` | Formats an ISO date string as `h:mmam/pm` (e.g. `2pm`, `9:30am`). |
| `sameDay(a, b)` | `(Date, Date) → boolean` | Returns true if two dates share year/month/day. |
| `isToday(d)` | `(Date) → boolean` | Returns true if `d` is today. |
| `startOfDay(d)` | `(Date) → Date` | Returns midnight of `d`. |
| `endOfDay(d)` | `(Date) → Date` | Returns 23:59:59.999 of `d`. |

### Recurrence

| Function | Signature | Description |
|---|---|---|
| `expand(event, rangeStart, rangeEnd)` | `(Event, Date, Date) → Event[]` | Expands a recurring event into individual occurrence objects within the range. Each occurrence has a composite `id`, `_masterId`, `_isOccurrence: true`, and adjusted `start`/`end`. Returns `[]` if no occurrences fall in range. |
| `parseRRule(rrule)` | `(string) → Object\|null` | Parses a semicolon-separated RRULE string into a key-value object. |

### ICS

| Function | Signature | Description |
|---|---|---|
| `exportICS(events)` | `(Event[]) → string` | Serialises events to a valid iCalendar string (RFC 5545). Lines folded at 75 chars. |
| `importICS(text)` | `(string) → Event[]` | Parses an iCalendar string and returns an array of event objects. Handles line unfolding, `VALARM` blocks, and `VALUE=DATE` all-day events. |

---

## 12. Data Structures

### Event Object

```js
{
  id:          string,          // 'evt-<timestamp>-<random>' or 'import-...'
  title:       string,
  description: string,          // Markdown body
  start:       string,          // ISO 8601, e.g. '2026-04-20T14:00:00'
  end:         string,          // ISO 8601
  allDay:      boolean,
  timezone:    string,          // IANA timezone, e.g. 'Asia/Colombo'
  location:    string,
  color:       string,          // colour name key from EVENT_COLORS
  label:       string,          // free text tag
  recurrence:  string,          // RRULE string or ''
  reminders:   number[],        // minutes before start
  attendees:   string[],        // email addresses
  attachments: string[],        // URLs
  created:     string,          // ISO 8601 timestamp
  modified:    string,          // ISO 8601 timestamp
}
```

### Recurrence Occurrence (virtual)

Same shape as Event, plus:

```js
{
  _masterId:     string,   // ID of the base recurring event
  _isOccurrence: true,
  id:            string,   // '<masterId>_YYYY-MM-DD'
  start:         string,   // adjusted for this occurrence
  end:           string,   // adjusted for this occurrence
}
```

### Setting Record (IndexedDB)

```js
{ key: string, value: any }
```

Currently used keys: `'theme'` (`'light'` | `'dark'`), `'seeded'` (`boolean`).

---

## 13. Contributing

Payas Days is open source under the MIT license. Contributions are welcome.

### How to Contribute

1. **Fork** the repository.
2. **Edit** files in `payas-days/` directly — no build step needed.
3. Test in both **Chromium** and **Firefox**, and on **mobile** screen sizes.
4. Test both **light and dark modes**.
5. Submit a **pull request** with a clear description of what changed and why.

### Coding Guidelines

- **No frameworks** — vanilla JS only, ES2022.
- **Module pattern** — keep each file's exports as a single returned object; no ES `import`/`export`.
- **Design tokens** — always use `var(--token-name)` for colours and shadows. Never hardcode colours in new CSS rules.
- **Dark mode** — every visual change must work in both themes. Test by toggling with the theme button.
- **Mobile first** — test at 375 px wide. The layout must remain usable and tappable.
- **No comments for obvious code** — only comment non-obvious logic (e.g. RRULE expansion edge cases, IndexedDB transaction patterns).

### Suggested Improvements

The following features are candidates for future versions:

- [ ] **Drag-and-drop rescheduling** — move events by dragging in Week/Day view
- [ ] **Multi-day event bars** — span all-day events across cells in Month view
- [ ] **Timezone display** — show event times in the stored timezone vs local timezone
- [ ] **Google Calendar sync** — two-way CalDAV or Google Calendar API integration
- [ ] **PWA / offline support** — Service Worker + Web App Manifest for installation
- [ ] **Repeat editing scope** — "this event / this and following / all events" for recurring edits
- [ ] **Accessibility** — keyboard navigation through event chips, ARIA live regions for view changes
- [ ] **Event search with date filters** — filter results by date range or label

---

## 14. License

```
MIT License

Copyright (c) 2026 Saman Wijesinghe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

*Payas Days — built with care by Saman Wijesinghe*
