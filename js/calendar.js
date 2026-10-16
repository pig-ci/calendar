/* Calendar view renderers */
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const Calendar = (() => {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  let currentDate = new Date();
  let currentView = 'month';
  let onEventClick = () => {};
  let onDayClick = () => {};

  function setDate(d) { currentDate = new Date(d); }
  function getDate() { return new Date(currentDate); }
  function setView(v) { currentView = v; }
  function getView() { return currentView; }
  function on(eventType, fn) {
    if (eventType === 'eventClick') onEventClick = fn;
    if (eventType === 'dayClick') onDayClick = fn;
  }

  function navigate(dir) {
    if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + dir);
    else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + dir * 7);
    else if (currentView === 'day') currentDate.setDate(currentDate.getDate() + dir);
    else if (currentView === 'agenda') currentDate.setDate(currentDate.getDate() + dir * 30);
  }

  function titleLabel() {
    if (currentView === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (currentView === 'week') {
      const ws = weekStart(currentDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      if (ws.getMonth() === we.getMonth()) return `${MONTHS[ws.getMonth()]} ${ws.getFullYear()}`;
      return `${MONTHS[ws.getMonth()].slice(0,3)} – ${MONTHS[we.getMonth()].slice(0,3)} ${we.getFullYear()}`;
    }
    if (currentView === 'day') return `${DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    if (currentView === 'agenda') {
      const rangeEnd = new Date(currentDate); rangeEnd.setDate(rangeEnd.getDate() + 29);
      if (rangeEnd.getMonth() === currentDate.getMonth() && rangeEnd.getFullYear() === currentDate.getFullYear()) {
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      }
      const endYear = rangeEnd.getFullYear();
      const yearSuffix = endYear !== currentDate.getFullYear() ? ` ${endYear}` : '';
      return `${MONTHS[currentDate.getMonth()].slice(0, 3)} – ${MONTHS[rangeEnd.getMonth()].slice(0, 3)}${yearSuffix} ${currentDate.getFullYear()}`;
    }
    return '';
  }

  /* ---- Helpers ---- */
  function weekStart(d) {
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    s.setHours(0,0,0,0);
    return s;
  }
  function startOfDay(d) {
    const r = new Date(d); r.setHours(0,0,0,0); return r;
  }
  function endOfDay(d) {
    const r = new Date(d); r.setHours(23,59,59,999); return r;
  }
  function sameDay(a, b) {
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }
  function isToday(d) { return sameDay(d, new Date()); }
  function fmtTime(iso) {
    const d = new Date(iso);
    let h = d.getHours(), m = d.getMinutes();
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}${m ? ':'+String(m).padStart(2,'0') : ''}${ap}`;
  }

  /* ---- Month view ---- */
  function renderMonth() {
    const grid = document.getElementById('monthGrid');
    const header = document.getElementById('monthDayNames');
    if (!grid || !header) return;

    header.innerHTML = DAYS.map(d => `<div>${d}</div>`).join('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Range: prev month fill + current month + next month fill
    const startCell = new Date(firstDay);
    startCell.setDate(startCell.getDate() - firstDay.getDay());
    const endCell = new Date(lastDay);
    const endDayOfWeek = lastDay.getDay();
    if (endDayOfWeek < 6) endCell.setDate(endCell.getDate() + (6 - endDayOfWeek));

    const eventsInRange = Events.getInRange(startOfDay(startCell), endOfDay(endCell));

    grid.innerHTML = '';
    const cursor = new Date(startCell);
    while (cursor <= endCell) {
      const cell = document.createElement('div');
      cell.className = 'pd-month-cell' +
        (cursor.getMonth() !== month ? ' other-month' : '') +
        (isToday(cursor) ? ' today' : '');

      const dateStr = cursor.toISOString().slice(0, 10);
      cell.dataset.date = dateStr;

      const numEl = document.createElement('div');
      numEl.className = 'pd-day-num';
      numEl.textContent = cursor.getDate();
      cell.appendChild(numEl);

      // Events for this day
      const dayEvs = eventsInRange.filter(ev => {
        const s = new Date(ev.start); const e = new Date(ev.end);
        const cd = new Date(cursor);
        return sameDay(s, cd) || (ev.allDay && s <= cd && e >= cd);
      }).sort((a, b) => new Date(a.start) - new Date(b.start));

      const MAX_SHOW = 3;
      dayEvs.slice(0, MAX_SHOW).forEach(ev => {
        const chip = document.createElement('div');
        chip.className = 'pd-event-chip';
        chip.style.background = Events.colorHex(ev.color);
        chip.textContent = (ev.allDay ? '' : fmtTime(ev.start) + ' ') + (ev.title || 'Untitled');
        chip.title = ev.title;
        chip.dataset.id = ev._masterId || ev.id;
        chip.addEventListener('click', e => { e.stopPropagation(); onEventClick(ev._masterId || ev.id, chip); });
        cell.appendChild(chip);
      });
      if (dayEvs.length > MAX_SHOW) {
        const more = document.createElement('div');
        more.className = 'pd-more-chip';
        more.textContent = `+${dayEvs.length - MAX_SHOW} more`;
        more.addEventListener('click', e => {
          e.stopPropagation();
          setView('day');
          setDate(new Date(cursor));
          onDayClick(new Date(cursor));
        });
        cell.appendChild(more);
      }

      cell.addEventListener('click', () => onDayClick(new Date(cursor)));
      grid.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  /* ---- Week view ---- */
  function renderWeek() {
    const headerEl = document.getElementById('weekHeader');
    const body = document.getElementById('weekBody');
    const gutter = document.getElementById('timeGutter');
    if (!headerEl || !body || !gutter) return;

    const ws = weekStart(currentDate);
    const rangeEnd = new Date(ws); rangeEnd.setDate(rangeEnd.getDate() + 6); rangeEnd.setHours(23,59,59,999);
    const eventsInRange = Events.getInRange(ws, rangeEnd);

    // Header
    headerEl.innerHTML = '<div style="width:56px;flex-shrink:0;border-right:1px solid var(--pd-border)"></div>';
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(d.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'pd-week-header-cell' + (isToday(d) ? ' today' : '');
      cell.innerHTML = `<div class="day-name">${DAYS[d.getDay()]}</div><div class="day-num">${d.getDate()}</div>`;
      cell.addEventListener('click', () => onDayClick(d));
      headerEl.appendChild(cell);
    }

    // Time gutter
    gutter.innerHTML = '';
    for (let h = 0; h < 24; h++) {
      const label = document.createElement('div');
      label.className = 'pd-time-slot-label';
      label.textContent = h === 0 ? '' : (h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`);
      gutter.appendChild(label);
    }

    // Day columns
    body.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(d.getDate() + i);
      const col = document.createElement('div');
      col.className = 'pd-day-column';
      for (let h = 0; h < 24; h++) {
        const line = document.createElement('div');
        line.className = 'pd-time-line';
        col.appendChild(line);
      }
      // Now line
      if (isToday(d)) {
        const now = new Date();
        const pct = (now.getHours() * 60 + now.getMinutes()) / 1440;
        const nowLine = document.createElement('div');
        nowLine.className = 'pd-now-line';
        nowLine.style.top = (pct * 1440) + 'px';
        col.appendChild(nowLine);
      }
      // Events
      const dayEvs = eventsInRange.filter(ev => !ev.allDay && sameDay(new Date(ev.start), d));
      placeWeekEvents(dayEvs, col);
      body.appendChild(col);
    }
    renderWeekAllDay(ws, eventsInRange);
  }

  function renderWeekAllDay(ws, eventsInRange) {
    const strip = document.getElementById('weekAllDayStrip');
    if (!strip) return;
    strip.innerHTML = '';
    const allDayEvs = eventsInRange.filter(ev => ev.allDay);
    if (allDayEvs.length === 0) return;

    const gutter = document.createElement('div');
    gutter.className = 'pd-allday-gutter';
    gutter.textContent = 'all-day';
    strip.appendChild(gutter);

    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(d.getDate() + i);
      const col = document.createElement('div');
      col.className = 'pd-allday-col';
      const dayEvs = allDayEvs.filter(ev => {
        const s = new Date(ev.start); const e = new Date(ev.end);
        return sameDay(s, d) || (s <= d && e >= d);
      });
      dayEvs.forEach(ev => {
        const chip = document.createElement('div');
        chip.className = 'pd-event-chip';
        chip.style.background = Events.colorHex(ev.color);
        chip.style.fontSize = '10px';
        chip.style.marginBottom = '1px';
        chip.textContent = ev.title || 'Untitled';
        chip.title = ev.title || '';
        chip.dataset.id = ev._masterId || ev.id;
        chip.addEventListener('click', e2 => { e2.stopPropagation(); onEventClick(ev._masterId || ev.id, chip); });
        col.appendChild(chip);
      });
      strip.appendChild(col);
    }
  }

  function renderDayAllDay(d, eventsInRange) {
    const strip = document.getElementById('dayAllDayStrip');
    if (!strip) return;
    strip.innerHTML = '';
    const allDayEvs = eventsInRange.filter(ev => ev.allDay);
    if (allDayEvs.length === 0) return;

    const gutter = document.createElement('div');
    gutter.className = 'pd-allday-gutter';
    gutter.style.width = '52px';
    gutter.textContent = 'all-day';
    strip.appendChild(gutter);

    const col = document.createElement('div');
    col.className = 'pd-allday-col';
    allDayEvs.forEach(ev => {
      const chip = document.createElement('div');
      chip.className = 'pd-event-chip';
      chip.style.background = Events.colorHex(ev.color);
      chip.style.marginBottom = '2px';
      chip.textContent = ev.title || 'Untitled';
      chip.title = ev.title || '';
      chip.dataset.id = ev._masterId || ev.id;
      chip.addEventListener('click', e2 => { e2.stopPropagation(); onEventClick(ev._masterId || ev.id, chip); });
      col.appendChild(chip);
    });
    strip.appendChild(col);
  }

  function placeWeekEvents(evs, col) {
    evs.forEach(ev => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      const startMin = s.getHours() * 60 + s.getMinutes();
      const durMin = Math.max(15, (e - s) / 60000);
      const el = document.createElement('div');
      el.className = 'pd-week-event';
      el.style.top = (startMin) + 'px';
      el.style.height = durMin + 'px';
      el.style.background = Events.colorHex(ev.color);
      el.textContent = ev.title || 'Untitled';
      el.title = ev.title;
      el.dataset.id = ev._masterId || ev.id;
      el.addEventListener('click', e2 => { e2.stopPropagation(); onEventClick(ev._masterId || ev.id, el); });
      col.appendChild(el);
    });
  }

  /* ---- Day view ---- */
  function renderDay() {
    const headerEl = document.getElementById('dayHeader');
    const body = document.getElementById('dayBody');
    const gutter = document.getElementById('dayTimeGutter');
    if (!headerEl || !body || !gutter) return;

    const d = new Date(currentDate);
    headerEl.innerHTML = `<h2>${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}</h2>`;

    gutter.innerHTML = '';
    for (let h = 0; h < 24; h++) {
      const label = document.createElement('div');
      label.className = 'pd-time-slot-label';
      label.textContent = h === 0 ? '' : (h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`);
      gutter.appendChild(label);
    }

    body.innerHTML = '';
    const col = document.createElement('div');
    col.className = 'pd-day-column';
    for (let h = 0; h < 24; h++) {
      const line = document.createElement('div');
      line.className = 'pd-time-line';
      col.appendChild(line);
    }
    if (isToday(d)) {
      const now = new Date();
      const pct = (now.getHours() * 60 + now.getMinutes());
      const nowLine = document.createElement('div');
      nowLine.className = 'pd-now-line';
      nowLine.style.top = pct + 'px';
      col.appendChild(nowLine);
    }
    const allEvs = Events.getInRange(startOfDay(d), endOfDay(d));
    placeWeekEvents(allEvs.filter(ev => !ev.allDay), col);
    body.appendChild(col);
    renderDayAllDay(d, allEvs);
  }

  /* ---- Agenda view ---- */
  function renderAgenda() {
    const list = document.getElementById('agendaList');
    if (!list) return;

    const rangeStart = startOfDay(currentDate);
    const rangeEnd = new Date(rangeStart); rangeEnd.setDate(rangeEnd.getDate() + 30);
    const evs = Events.getInRange(rangeStart, rangeEnd)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    list.innerHTML = '';

    if (evs.length === 0) {
      list.innerHTML = '<div class="pd-agenda-empty"><i class="fa-regular fa-calendar-xmark fa-2x mb-3 d-block"></i>No events in the next 30 days.</div>';
      return;
    }

    // Group by day
    const byDay = {};
    for (const ev of evs) {
      const key = new Date(ev.start).toISOString().slice(0, 10);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(ev);
    }

    for (const [dateKey, dayEvs] of Object.entries(byDay)) {
      const d = new Date(dateKey + 'T00:00:00');
      const dayEl = document.createElement('div');
      dayEl.className = 'pd-agenda-day';

      const hdr = document.createElement('div');
      hdr.className = 'pd-agenda-day-header' + (isToday(d) ? ' today' : '');
      hdr.innerHTML = `<div class="day-num">${d.getDate()}</div>
        <div class="day-info"><span class="fw-bold">${DAYS[d.getDay()]}</span> · ${MONTHS[d.getMonth()]} ${d.getFullYear()}${isToday(d) ? ' · <span style="color:var(--pd-accent)">Today</span>' : ''}</div>`;
      dayEl.appendChild(hdr);

      for (const ev of dayEvs) {
        const evEl = document.createElement('div');
        evEl.className = 'pd-agenda-event';
        const colorBar = document.createElement('div');
        colorBar.className = 'pd-agenda-color';
        colorBar.style.background = Events.colorHex(ev.color);
        const timeEl = document.createElement('div');
        timeEl.className = 'pd-agenda-time';
        timeEl.textContent = ev.allDay ? 'All day' : `${fmtTime(ev.start)} – ${fmtTime(ev.end)}`;
        const info = document.createElement('div');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'pd-agenda-title';
        titleDiv.textContent = ev.title || 'Untitled';
        info.appendChild(titleDiv);
        if (ev.location) {
          const locDiv = document.createElement('div');
          locDiv.className = 'pd-agenda-subtitle';
          locDiv.innerHTML = '<i class="fa-solid fa-location-dot me-1"></i>';
          locDiv.appendChild(document.createTextNode(ev.location));
          info.appendChild(locDiv);
        }
        evEl.appendChild(colorBar);
        evEl.appendChild(timeEl);
        evEl.appendChild(info);
        evEl.dataset.id = ev._masterId || ev.id;
        evEl.addEventListener('click', () => onEventClick(ev._masterId || ev.id, evEl));
        dayEl.appendChild(evEl);
      }
      list.appendChild(dayEl);
    }
  }

  function render() {
    // Hide/show views
    ['viewMonth','viewWeek','viewDay','viewAgenda'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('d-none');
    });
    const active = {
      month: 'viewMonth', week: 'viewWeek', day: 'viewDay', agenda: 'viewAgenda'
    }[currentView];
    if (active) document.getElementById(active)?.classList.remove('d-none');

    if (currentView === 'month') renderMonth();
    else if (currentView === 'week') renderWeek();
    else if (currentView === 'day') renderDay();
    else if (currentView === 'agenda') renderAgenda();

    // Scroll to 8am in week/day
    if (currentView === 'week' || currentView === 'day') {
      setTimeout(() => {
        const wrap = document.querySelector('.pd-week-body-wrap');
        if (wrap) wrap.scrollTop = 60 * 8 - 20;
      }, 50);
    }
  }

  return {
    setDate, getDate, setView, getView, navigate, titleLabel, render, on,
    MONTHS, DAYS, fmtTime, sameDay, isToday, startOfDay, endOfDay
  };
})();
