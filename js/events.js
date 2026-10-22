'use strict';

/*
 * 事件快取、查詢、衝突偵測與瀏覽器通知排程。
 * colorHex：取得顏色代碼；無內部函式依賴。
 * load：從儲存層載入事件快取；依賴 Storage.getAllEvents。
 * save：儲存事件並更新快取、提醒；依賴 Storage.saveEvent、load、scheduleReminders。
 * remove：刪除事件並取消該事件提醒計時器；依賴 Storage.deleteEvent。
 * getAll、getById、isImportant：讀取快取或判斷事件類型；無內部函式依賴。
 * hasValidRange：檢查事件起訖時間；無內部函式依賴。
 * getInRange：取得日期範圍內事件並展開重複事件；依賴 hasValidRange、Recurrence.expand。
 * search：依文字搜尋事件欄位；無內部函式依賴。
 * detectConflicts：找出與新事件重疊的事件；依賴 hasValidRange、Recurrence.expand。
 * scheduleReminders：排程單一事件通知；依賴 hasValidRange。
 * scheduleAllReminders：為快取中的事件排程通知；依賴 scheduleReminders。
 */
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
    const eventId = String(id);
    for (const key of Object.keys(scheduledTimers)) {
      if (key.slice(0, key.lastIndexOf('_')) !== eventId) continue;
      clearTimeout(scheduledTimers[key]);
      delete scheduledTimers[key];
    }
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
   * 回傳與 [start, end] 範圍重疊的所有事件（包含展開後的重複事件）。
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

  /* ---- 衝突偵測 ---- */
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

  /* ---- 瀏覽器通知提醒 ---- */
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
    // 僅在已授予通知權限時排程，載入時絕不自動要求權限
    if (Notification.permission !== 'granted') return;
    for (const ev of cache) scheduleReminders(ev);
  }

  return {
    load, save, remove, getAll, getById, getInRange, search,
    detectConflicts, scheduleAllReminders, colorHex, isImportant, EVENT_COLORS
  };
})();
