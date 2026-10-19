/* Event management — CRUD, reminders, conflict detection */
const Events = (() => {
  let cache = [];

  const EVENT_COLORS = {
    blue:    '#2383e2',
    teal:    '#0d9488',
    green:   '#16a34a',
    yellow:  '#ca8a04',
    orange:  '#ea580c',
    red:     '#dc2626',
    pink:    '#db2777',
    purple:  '#9333ea',
    gray:    '#6b7280',
    indigo:  '#4f46e5',
  };

  function colorHex(name) { return EVENT_COLORS[name] || name || EVENT_COLORS.blue; }

  async function load() {
    cache = await Storage.getAllEvents();
    return cache;
  }

  async function save(ev) {
    await Storage.saveEvent(ev);
    await load();
    scheduleReminders(ev);
    return ev;
  }

  async function remove(id) {
    await Storage.deleteEvent(id);
    cache = cache.filter(e => e.id !== id);
  }

  function getAll() { return cache; }

  function getById(id) { return cache.find(e => e.id === id); }

  function isImportant(ev) { return ev.type !== 'detail'; }

  function hasValidRange(ev) {
    const start = new Date(ev.start).getTime();
    const end = new Date(ev.end).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && end > start;
  }

  /**
   * Returns all events (including recurrence expansions) that overlap [start, end].
   */
  function getInRange(rangeStart, rangeEnd) {
    const results = [];
    for (const ev of cache) {
      if (!hasValidRange(ev)) continue;
      if (ev.recurrence) {
        const expanded = Recurrence.expand(ev, rangeStart, rangeEnd);
        results.push(...expanded);
      } else {
        const s = new Date(ev.start);
        const e = new Date(ev.end);
        if (s <= rangeEnd && e >= rangeStart) results.push(ev);
      }
    }
    return results;
  }

  function search(query) {
    const q = query.toLowerCase();
    return cache.filter(ev =>
      (ev.title || '').toLowerCase().includes(q) ||
      (ev.description || '').toLowerCase().includes(q) ||
      (ev.location || '').toLowerCase().includes(q) ||
      (ev.label || '').toLowerCase().includes(q)
    );
  }

  /* ---- Conflict detection ---- */
  function detectConflicts(newEv) {
    if (newEv.allDay || !hasValidRange(newEv)) return [];
    const ns = new Date(newEv.start);
    const ne = new Date(newEv.end);
    const candidates = [];
    for (const ev of cache) {
      if (ev.id === newEv.id || ev.allDay || !hasValidRange(ev)) continue;
      if (ev.recurrence) {
        candidates.push(...Recurrence.expand(ev, ns, ne));
      } else {
        candidates.push(ev);
      }
    }
    return candidates.filter(ev => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      return s < ne && e > ns;
    });
  }

  /* ---- Browser notification reminders ---- */
  const scheduledTimers = {};

  function scheduleReminders(ev) {
    if (!hasValidRange(ev) || !ev.reminders || !ev.reminders.length) return;
    if (!('Notification' in window)) return;
    const start = new Date(ev.start);
    for (const mins of ev.reminders) {
      const fireAt = new Date(start.getTime() - mins * 60000);
      const now = Date.now();
      const delay = fireAt.getTime() - now;
      if (delay < 0) continue;
      const key = ev.id + '_' + mins;
      clearTimeout(scheduledTimers[key]);
      scheduledTimers[key] = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Payas Days', {
            body: `${ev.title} 將於 ${mins} 分鐘後開始`,
            icon: '/favicon.ico'
          });
        }
      }, delay);
    }
  }

  async function scheduleAllReminders() {
    if (!('Notification' in window)) return;
    // Only schedule if already granted — never auto-prompt on load
    if (Notification.permission !== 'granted') return;
    for (const ev of cache) scheduleReminders(ev);
  }

  return {
    load, save, remove, getAll, getById, getInRange, search,
    detectConflicts, scheduleAllReminders, colorHex, isImportant, EVENT_COLORS
  };
})();
