'use strict';

/*
 * 日曆狀態、日期工具與五種檢視的 DOM 渲染。
 * setDate、getDate、setView、getView、set24HourTime：設定或讀取日曆狀態；setView 僅接受 VALID_VIEWS；無內部函式依賴。
 * on：註冊事件點擊與日期點擊回呼；無內部函式依賴。
 * navigate：依目前檢視移動日期；無內部函式依賴。
 * titleLabel：產生導覽標題；依賴 weekStart。
 * weekStart、startOfDay、endOfDay、sameDay、dateKey：日期計算；無內部函式依賴。
 * eventDaySpan：計算事件跨日範圍；依賴 startOfDay、dateIndex。
 * dateIndex：計算日期相對於範圍起點的日數；由 eventDaySpan 建立及呼叫；無內部函式依賴。
 * isToday：判斷日期是否為今天；依賴 sameDay。
 * fmtTime：依時間制偏好格式化時間；無內部函式依賴。
 * renderMonth：渲染月檢視；依賴 startOfDay、endOfDay、isToday、eventDaySpan、fmtTime、Events.getInRange、Events.isImportant、Events.colorHex。
 * renderYear：渲染年檢視；依賴 isToday。
 * renderWeek：渲染週檢視；依賴 weekStart、isToday、eventDaySpan、sameDay、placeWeekEvents、placeWeekMultiDayEvents、renderAllDay、Events.getInRange、Events.isImportant。
 * placeWeekMultiDayEvents：放置跨日週事件；依賴 eventDaySpan、fmtTime、Events.colorHex。
 * renderAllDay：渲染全天事件列；依賴 eventDaySpan、createAllDayChip。
 * createAllDayChip：建立全天事件項目；依賴 Events.colorHex。
 * placeWeekEvents：放置單日事件並可顯示詳細資料；依賴 startOfDay、endOfDay、fmtTime、Events.colorHex。
 * renderDay：渲染日檢視；依賴 startOfDay、endOfDay、isToday、placeWeekEvents、renderAllDay、Events.getInRange。
 * renderAgenda：渲染議程列表；依賴 startOfDay、dateKey、isToday、fmtTime、Events.getInRange、Events.colorHex。
 * render：切換並執行目前檢視的渲染；依賴 renderYear、renderMonth、renderWeek、renderDay、renderAgenda。
 */
const Calendar = (() => {
  const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
  const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const VALID_VIEWS = new Set(['year', 'month', 'week', 'day', 'agenda']);

  let currentDate = new Date();
  let currentView = 'month';
  let onEventClick = () => {};
  let onDayClick = () => {};
  let use24HourTime = false;

  function setDate(d) { currentDate = new Date(d); }
  function getDate() { return new Date(currentDate); }
  function setView(v) {
    if (VALID_VIEWS.has(v)) currentView = v;
  }
  function getView() { return currentView; }
  function set24HourTime(enabled) { use24HourTime = enabled; }
  function on(eventType, fn) {
    if (eventType === 'eventClick') onEventClick = fn;
    if (eventType === 'dayClick') onDayClick = fn;
  }

  function navigate(dir) {
    if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() + dir);
    else if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + dir);
    else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + dir * 7);
    else if (currentView === 'day') currentDate.setDate(currentDate.getDate() + dir);
    else if (currentView === 'agenda') currentDate.setDate(currentDate.getDate() + dir * 30);
  }

  function titleLabel() {
    if (currentView === 'year') return `${currentDate.getFullYear()}年`;
    if (currentView === 'month') return `${currentDate.getFullYear()}年${MONTHS[currentDate.getMonth()]}`;
    if (currentView === 'week') {
      const ws = weekStart(currentDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      if (ws.getMonth() === we.getMonth()) return `${ws.getFullYear()}年${MONTHS[ws.getMonth()]}`;
      return `${ws.getFullYear()}年${MONTHS[ws.getMonth()]} – ${we.getFullYear()}年${MONTHS[we.getMonth()]}`;
    }
    if (currentView === 'day') return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日（星期${DAYS[currentDate.getDay()]}）`;
    if (currentView === 'agenda') {
      const rangeEnd = new Date(currentDate); rangeEnd.setDate(rangeEnd.getDate() + 29);
      if (rangeEnd.getMonth() === currentDate.getMonth() && rangeEnd.getFullYear() === currentDate.getFullYear()) {
        return `${currentDate.getFullYear()}年${MONTHS[currentDate.getMonth()]}`;
      }
      const endYear = rangeEnd.getFullYear();
      const startLabel = `${currentDate.getFullYear()}年${MONTHS[currentDate.getMonth()]}`;
      const endLabel = `${endYear === currentDate.getFullYear() ? '' : `${endYear}年`}${MONTHS[rangeEnd.getMonth()]}`;
      return `${startLabel} – ${endLabel}`;
    }
    return '';
  }

  /* ---- 輔助函式 ---- */
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
  function eventDaySpan(ev, rangeStart) {
    const start = startOfDay(new Date(ev.start));
    const endDate = new Date(ev.end);
    const end = startOfDay(endDate);
    if (end > start && end.getTime() === endDate.getTime()) end.setDate(end.getDate() - 1);
    const dateIndex = date => Math.round((
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate())
    ) / 86400000);
    return { startDay: dateIndex(start), endDay: Math.max(dateIndex(start), dateIndex(end)) };
  }
  function sameDay(a, b) {
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }
  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function isToday(d) { return sameDay(d, new Date()); }
  function fmtTime(iso) {
    const d = new Date(iso);
    let h = d.getHours(), m = d.getMinutes();
    if (use24HourTime) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const ap = h === 0 ? '凌晨' : h === 12 ? '中午' : h > 12 ? '下午' : '上午';
    h = h % 12 || 12;
    return `${ap}${h}:${String(m).padStart(2,'0')}`;
  }

  /* ---- 月檢視 ---- */
  function renderMonth() {
    const grid = document.getElementById('monthGrid');
    const header = document.getElementById('monthDayNames');
    if (!grid || !header) return;

    header.innerHTML = DAYS.map(d => `<div>${d}</div>`).join('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 範圍：填入上個月、本月及下個月的日期
    const startCell = new Date(firstDay);
    startCell.setDate(startCell.getDate() - firstDay.getDay());
    const endCell = new Date(lastDay);
    const endDayOfWeek = lastDay.getDay();
    if (endDayOfWeek < 6) endCell.setDate(endCell.getDate() + (6 - endDayOfWeek));

    const eventsInRange = Events.getInRange(startOfDay(startCell), endOfDay(endCell));

    grid.innerHTML = '';
    const weekStartDate = new Date(startCell);
    while (weekStartDate <= endCell) {
      const week = document.createElement('div');
      week.className = 'pd-month-week';

      const weekDates = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + dayIndex);
        weekDates.push(date);

        const cell = document.createElement('div');
        cell.className = 'pd-month-cell' +
          (date.getMonth() !== month ? ' other-month' : '') +
          (isToday(date) ? ' today' : '');
        cell.style.gridColumn = String(dayIndex + 1);
        cell.style.gridRow = '1 / -1';
        cell.dataset.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const numEl = document.createElement('div');
        numEl.className = 'pd-day-num';
        numEl.textContent = date.getDate();
        cell.appendChild(numEl);
        cell.addEventListener('click', () => onDayClick(new Date(date)));
        week.appendChild(cell);
      }

      const weekEvents = eventsInRange.filter(Events.isImportant).map(event => ({
        event,
        ...eventDaySpan(event, weekStartDate)
      })).filter(item => item.startDay <= 6 && item.endDay >= 0)
        .sort((a, b) => a.startDay - b.startDay || b.endDay - a.endDay || new Date(a.event.start) - new Date(b.event.start));
      const laneEnds = [];
      weekEvents.forEach(({ event, startDay, endDay }) => {
        const firstDay = Math.max(0, startDay);
        const lastDay = Math.min(6, endDay);
        let lane = laneEnds.findIndex(lastOccupiedDay => lastOccupiedDay < firstDay);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = lastDay;

        const bar = document.createElement('div');
        bar.className = 'pd-event-chip pd-month-event';
        bar.style.background = Events.colorHex(event.color);
        bar.style.gridColumn = `${firstDay + 1} / ${lastDay + 2}`;
        bar.style.gridRow = String(lane + 2);
        bar.textContent = `${event.allDay ? '' : `${fmtTime(event.start)} `}${event.title || '未命名事件'}`;
        bar.title = event.title || '';
        bar.dataset.id = event._masterId || event.id;
        bar.addEventListener('click', e => {
          e.stopPropagation();
          onEventClick(event._masterId || event.id, bar);
        });
        week.appendChild(bar);
      });

      week.style.gridTemplateRows = `30px repeat(${laneEnds.length}, 18px) minmax(0, 1fr)`;
      grid.appendChild(week);
      weekStartDate.setDate(weekStartDate.getDate() + 7);
    }
  }

  /* ---- 年檢視 ---- */
  function renderYear() {
    const grid = document.getElementById('yearGrid');
    if (!grid) return;

    const year = currentDate.getFullYear();
    grid.innerHTML = '';

    for (let month = 0; month < 12; month++) {
      const monthEl = document.createElement('section');
      monthEl.className = 'pd-year-month';

      const heading = document.createElement('h2');
      heading.className = 'pd-year-month-title';
      heading.textContent = MONTHS[month];
      monthEl.appendChild(heading);

      const daysGrid = document.createElement('div');
      daysGrid.className = 'pd-year-month-grid';
      DAYS.forEach(day => {
        const dayName = document.createElement('span');
        dayName.className = 'pd-year-weekday';
        dayName.textContent = day;
        daysGrid.appendChild(dayName);
      });

      const firstWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let blank = 0; blank < firstWeekday; blank++) {
        const emptyDay = document.createElement('span');
        emptyDay.className = 'pd-year-day empty';
        emptyDay.setAttribute('aria-hidden', 'true');
        daysGrid.appendChild(emptyDay);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayEl = document.createElement('span');
        dayEl.className = 'pd-year-day' + (isToday(date) ? ' today' : '');
        dayEl.textContent = day;
        dayEl.title = `${year}年${month + 1}月${day}日`;
        daysGrid.appendChild(dayEl);
      }

      monthEl.appendChild(daysGrid);
      grid.appendChild(monthEl);
    }
  }

  /* ---- 週檢視 ---- */
  function renderWeek() {
    const headerEl = document.getElementById('weekHeader');
    const body = document.getElementById('weekBody');
    const gutter = document.getElementById('timeGutter');
    if (!headerEl || !body || !gutter) return;

    const ws = weekStart(currentDate);
    const rangeEnd = new Date(ws); rangeEnd.setDate(rangeEnd.getDate() + 6); rangeEnd.setHours(23,59,59,999);
    const eventsInRange = Events.getInRange(ws, rangeEnd).filter(Events.isImportant);

    // 標題列
    headerEl.innerHTML = '<div style="width:56px;flex-shrink:0;border-right:1px solid var(--pd-border)"></div>';
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(d.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'pd-week-header-cell' + (isToday(d) ? ' today' : '');
      cell.innerHTML = `<div class="day-name">${DAYS[d.getDay()]}</div><div class="day-num">${d.getDate()}</div>`;
      cell.addEventListener('click', () => onDayClick(d));
      headerEl.appendChild(cell);
    }

    // 時間欄
    gutter.innerHTML = '';
    for (let h = 0; h < 24; h++) {
      const label = document.createElement('div');
      label.className = 'pd-time-slot-label';
      label.textContent = h === 0 ? '' : `${String(h).padStart(2, '0')}:00`;
      gutter.appendChild(label);
    }

    // 每日欄位
    body.innerHTML = '';
    const timedEvents = eventsInRange.filter(ev => !ev.allDay);
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(d.getDate() + i);
      const col = document.createElement('div');
      col.className = 'pd-day-column';
      for (let h = 0; h < 24; h++) {
        const line = document.createElement('div');
        line.className = 'pd-time-line';
        col.appendChild(line);
      }
      // 現在時間線
      if (isToday(d)) {
        const now = new Date();
        const pct = (now.getHours() * 60 + now.getMinutes()) / 1440;
        const nowLine = document.createElement('div');
        nowLine.className = 'pd-now-line';
        nowLine.style.top = (pct * 1440) + 'px';
        col.appendChild(nowLine);
      }
      // 事件
      const dayEvs = timedEvents.filter(ev => {
        const span = eventDaySpan(ev, ws);
        return span.startDay === span.endDay && sameDay(new Date(ev.start), d);
      });
      placeWeekEvents(dayEvs, col);
      body.appendChild(col);
    }
    placeWeekMultiDayEvents(timedEvents.filter(ev => {
      const span = eventDaySpan(ev, ws);
      return span.startDay < span.endDay;
    }), body, ws);
    renderAllDay('weekAllDayStrip', eventsInRange, { weekStart: ws });
  }

  function placeWeekMultiDayEvents(events, body, ws) {
    events.forEach(ev => {
      const start = new Date(ev.start);
      const end = new Date(ev.end);
      const { startDay, endDay } = eventDaySpan(ev, ws);
      const firstDay = Math.max(0, startDay);
      const lastDay = Math.min(6, endDay);
      const endIsMidnight = end.getHours() === 0 && end.getMinutes() === 0 &&
        end.getSeconds() === 0 && end.getMilliseconds() === 0;
      const endFraction = endIsMidnight
        ? 1
        : (end.getHours() * 60 + end.getMinutes() + end.getSeconds() / 60) / 1440;
      const endPosition = Math.min(7, lastDay + endFraction);
      const bar = document.createElement('div');
      bar.className = 'pd-week-event pd-week-multiday-event';
      bar.style.top = `${startDay < 0 ? 0 : start.getHours() * 60 + start.getMinutes()}px`;
      bar.style.left = `${firstDay / 7 * 100}%`;
      bar.style.right = `${(7 - endPosition) / 7 * 100}%`;
      bar.style.background = Events.colorHex(ev.color);
      bar.textContent = `${fmtTime(ev.start)} – ${fmtTime(ev.end)} · ${ev.title || '未命名事件'}`;
      bar.title = ev.title || '';
      bar.dataset.id = ev._masterId || ev.id;
      bar.addEventListener('click', e => {
        e.stopPropagation();
        onEventClick(ev._masterId || ev.id, bar);
      });
      body.appendChild(bar);
    });
  }

  function renderAllDay(stripId, eventsInRange, { weekStart: ws = null, gutterWidth = null } = {}) {
    const strip = document.getElementById(stripId);
    if (!strip) return;
    strip.innerHTML = '';
    const allDayEvs = eventsInRange.filter(ev => ev.allDay);
    const weekEvents = ws && allDayEvs.map(event => {
      const { startDay, endDay } = eventDaySpan(event, ws);
      return {
        event,
        startDay: Math.max(0, startDay),
        endDay: Math.min(6, Math.max(startDay, endDay)),
        overlapsWeek: startDay <= 6 && endDay >= 0
      };
    }).filter(item => item.overlapsWeek)
      .sort((a, b) => a.startDay - b.startDay || b.endDay - a.endDay);
    if (ws ? weekEvents.length === 0 : allDayEvs.length === 0) return;

    const gutter = document.createElement('div');
    gutter.className = 'pd-allday-gutter';
    if (gutterWidth) gutter.style.width = gutterWidth;
    gutter.textContent = '全天';
    strip.appendChild(gutter);

    if (ws) {
      const grid = document.createElement('div');
      grid.className = 'pd-allday-grid';
      const laneEnds = [];
      weekEvents.forEach(({ event, startDay, endDay }) => {
        let lane = laneEnds.findIndex(lastDay => lastDay < startDay);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = endDay;

        const chip = createAllDayChip(event);
        chip.style.gridColumn = `${startDay + 1} / ${endDay + 2}`;
        chip.style.gridRow = String(lane + 1);
        grid.appendChild(chip);
      });
      strip.appendChild(grid);
      return;
    }

    const col = document.createElement('div');
    col.className = 'pd-allday-col';
    allDayEvs.forEach(event => {
      const chip = createAllDayChip(event);
      chip.style.marginBottom = '2px';
      col.appendChild(chip);
    });
    strip.appendChild(col);
  }

  function createAllDayChip(event) {
    const chip = document.createElement('div');
    chip.className = 'pd-event-chip';
    chip.style.background = Events.colorHex(event.color);
    chip.textContent = event.title || '未命名事件';
    chip.title = event.title || '';
    chip.dataset.id = event._masterId || event.id;
    chip.addEventListener('click', e => {
      e.stopPropagation();
      onEventClick(event._masterId || event.id, chip);
    });
    return chip;
  }

  function placeWeekEvents(evs, col, showDetails = false, visibleDay = null) {
    evs.forEach(ev => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      let visibleStart = s;
      let visibleEnd = e;
      if (visibleDay) {
        const dayStart = startOfDay(visibleDay);
        const dayEnd = endOfDay(visibleDay);
        if (e <= dayStart || s > dayEnd) return;
        visibleStart = s < dayStart ? dayStart : s;
        visibleEnd = e > dayEnd ? dayEnd : e;
      }
      const startMin = visibleStart.getHours() * 60 + visibleStart.getMinutes();
      const durMin = Math.max(15, (visibleEnd - visibleStart) / 60000);
      const el = document.createElement('div');
      el.className = 'pd-week-event' + (showDetails ? ' pd-day-event' : '');
      el.style.top = (startMin) + 'px';
      el.style.height = durMin + 'px';
      el.style.background = Events.colorHex(ev.color);
      el.title = ev.title || '';
      el.dataset.id = ev._masterId || ev.id;

      if (showDetails) {
        const title = document.createElement('div');
        title.className = 'pd-day-event-title';
        title.textContent = ev.title || '未命名事件';
        el.appendChild(title);

        const time = document.createElement('div');
        time.className = 'pd-day-event-time';
        time.textContent = `${fmtTime(visibleStart)} – ${fmtTime(visibleEnd)}`;
        el.appendChild(time);

        [ev.location, ev.label, ev.description].forEach((detail, index) => {
          if (!detail) return;
          const detailEl = document.createElement('div');
          detailEl.className = `pd-day-event-detail${index === 2 ? ' description' : ''}`;
          detailEl.textContent = detail;
          el.appendChild(detailEl);
        });
      } else {
        el.textContent = ev.title || '未命名事件';
      }

      el.addEventListener('click', e2 => { e2.stopPropagation(); onEventClick(ev._masterId || ev.id, el); });
      col.appendChild(el);
    });
  }

  /* ---- 日檢視 ---- */
  function renderDay() {
    const headerEl = document.getElementById('dayHeader');
    const body = document.getElementById('dayBody');
    const gutter = document.getElementById('dayTimeGutter');
    if (!headerEl || !body || !gutter) return;

    const d = new Date(currentDate);
    headerEl.innerHTML = `<h2>${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（星期${DAYS[d.getDay()]}）</h2>`;

    gutter.innerHTML = '';
    for (let h = 0; h < 24; h++) {
      const label = document.createElement('div');
      label.className = 'pd-time-slot-label';
      label.textContent = h === 0 ? '' : `${String(h).padStart(2, '0')}:00`;
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
      const nowLine = document.createElement('div');
      nowLine.className = 'pd-now-line';
      nowLine.style.top = `${new Date().getHours() * 60 + new Date().getMinutes()}px`;
      col.appendChild(nowLine);
    }
    const allEvs = Events.getInRange(startOfDay(d), endOfDay(d));
    placeWeekEvents(allEvs.filter(ev => !ev.allDay), col, true, d);
    body.appendChild(col);
    renderAllDay('dayAllDayStrip', allEvs, { gutterWidth: '52px' });
  }

  /* ---- 議程檢視 ---- */
  function renderAgenda() {
    const list = document.getElementById('agendaList');
    if (!list) return;

    const rangeStart = startOfDay(currentDate);
    const rangeEnd = new Date(rangeStart); rangeEnd.setDate(rangeEnd.getDate() + 29);
    const evs = Events.getInRange(rangeStart, rangeEnd)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    list.innerHTML = '';

    if (evs.length === 0) {
      list.innerHTML = '<div class="pd-agenda-empty"><i class="fa-regular fa-calendar-xmark fa-2x mb-3 d-block"></i>未來 30 天沒有事件。</div>';
      return;
    }

    // 依日期分組
    const byDay = {};
    for (const ev of evs) {
      const key = dateKey(new Date(ev.start));
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(ev);
    }

    for (const [dayKey, dayEvs] of Object.entries(byDay)) {
      const d = new Date(dayKey + 'T00:00:00');
      const dayEl = document.createElement('div');
      dayEl.className = 'pd-agenda-day';

      const hdr = document.createElement('div');
      hdr.className = 'pd-agenda-day-header' + (isToday(d) ? ' today' : '');
      hdr.innerHTML = `<div class="day-num">${d.getDate()}</div>
        <div class="day-info"><span class="fw-bold">星期${DAYS[d.getDay()]}</span> · ${d.getFullYear()}年${d.getMonth() + 1}月${isToday(d) ? ' · <span style="color:var(--pd-accent)">今天</span>' : ''}</div>`;
      dayEl.appendChild(hdr);

      for (const ev of dayEvs) {
        const evEl = document.createElement('div');
        evEl.className = 'pd-agenda-event';
        const colorBar = document.createElement('div');
        colorBar.className = 'pd-agenda-color';
        colorBar.style.background = Events.colorHex(ev.color);
        const timeEl = document.createElement('div');
        timeEl.className = 'pd-agenda-time';
        timeEl.textContent = ev.allDay ? '全天' : `${fmtTime(ev.start)} – ${fmtTime(ev.end)}`;
        const info = document.createElement('div');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'pd-agenda-title';
        titleDiv.textContent = ev.title || '未命名事件';
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
    // 隱藏／顯示檢視
    ['viewYear','viewMonth','viewWeek','viewDay','viewAgenda'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('d-none');
    });
    const active = {
      year: 'viewYear', month: 'viewMonth', week: 'viewWeek', day: 'viewDay', agenda: 'viewAgenda'
    }[currentView];
    if (active) document.getElementById(active)?.classList.remove('d-none');

    if (currentView === 'year') renderYear();
    else if (currentView === 'month') renderMonth();
    else if (currentView === 'week') renderWeek();
    else if (currentView === 'day') renderDay();
    else if (currentView === 'agenda') renderAgenda();

    // 在週／日檢視中捲動至上午 8 點
    if (currentView === 'week' || currentView === 'day') {
      const viewId = currentView === 'day' ? 'viewDay' : 'viewWeek';
      setTimeout(() => {
        const wrap = document.querySelector(`#${viewId} .pd-week-body-wrap`);
        if (!wrap) return;
        if (currentView === 'day') {
          const gutter = document.getElementById('dayTimeGutter');
          const eightAm = Array.from(gutter?.children || []).slice(0, 8)
            .reduce((height, label) => height + label.offsetHeight, 0);
          wrap.scrollTop = eightAm - 20;
        } else {
          wrap.scrollTop = 60 * 8 - 20;
        }
      }, 50);
    }
  }

  return {
    setDate, getDate, setView, getView, navigate, titleLabel, render, on,
    MONTHS, DAYS, fmtTime, sameDay, isToday, startOfDay, endOfDay, set24HourTime
  };
})();
