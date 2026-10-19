/* 儲存介接層 — 使用 IndexedDB，支援 Markdown 匯入／匯出 */
const Storage = (() => {
  const DB_NAME = 'payas-days';
  const DB_VERSION = 1;
  const STORE_EVENTS = 'events';
  const STORE_SETTINGS = 'settings';
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) { resolve(db); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_EVENTS)) {
          const s = d.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
          s.createIndex('start', 'start', { unique: false });
          s.createIndex('label', 'label', { unique: false });
        }
        if (!d.objectStoreNames.contains(STORE_SETTINGS)) {
          d.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(storeName, mode = 'readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function promisify(req) {
    return new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async function getAllEvents() {
    await open();
    return promisify(tx(STORE_EVENTS).getAll());
  }

  async function getEvent(id) {
    await open();
    return promisify(tx(STORE_EVENTS).get(id));
  }

  async function saveEvent(event) {
    await open();
    if (!event.id) event.id = 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    event.modified = new Date().toISOString();
    if (!event.created) event.created = event.modified;
    return promisify(tx(STORE_EVENTS, 'readwrite').put(event));
  }

  async function deleteEvent(id) {
    await open();
    return promisify(tx(STORE_EVENTS, 'readwrite').delete(id));
  }

  async function clearAllEvents() {
    await open();
    return promisify(tx(STORE_EVENTS, 'readwrite').clear());
  }

  async function getSetting(key, fallback = null) {
    await open();
    const r = await promisify(tx(STORE_SETTINGS).get(key));
    return r ? r.value : fallback;
  }

  async function setSetting(key, value) {
    await open();
    return promisify(tx(STORE_SETTINGS, 'readwrite').put({ key, value }));
  }

  /* ---- Markdown 序列化 ---- */
  function yamlStr(v) {
    const s = String(v);
    // 空值、類布林值或以 YAML 特殊字元開頭的值需加上引號
    if (s === '' || s === 'true' || s === 'false' || s === 'null' ||
        s.startsWith('#') || s.startsWith('"') || s.startsWith("'") ||
        s !== s.trim()) {
      return JSON.stringify(s);
    }
    return s;
  }

  function eventToMarkdown(ev) {
    const front = {
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay || false,
      type: ev.type || 'important',
      timezone: ev.timezone || 'UTC',
      location: ev.location || '',
      attendees: ev.attendees || [],
      color: ev.color || 'blue',
      label: ev.label || '',
      recurrence: ev.recurrence || '',
      reminders: ev.reminders || [],
      attachments: ev.attachments || [],
      created: ev.created,
      modified: ev.modified,
    };
    const yaml = Object.entries(front)
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          if (v.length === 0) return `${k}: []`;
          return `${k}:\n${v.map(i => `  - ${yamlStr(String(i))}`).join('\n')}`;
        }
        if (typeof v === 'boolean') return `${k}: ${v}`;
        return `${k}: ${yamlStr(String(v === null || v === undefined ? '' : v))}`;
      }).join('\n');
    return `---\n${yaml}\n---\n\n${ev.description || ''}\n`;
  }

  function markdownToEvent(md) {
    const match = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return null;
    const [, frontRaw, body] = match;
    const ev = { description: body.trim() };
    let currentKey = null;
    for (const line of frontRaw.split('\n')) {
      const listMatch = line.match(/^  - (.+)$/);
      if (listMatch && currentKey) {
        if (!Array.isArray(ev[currentKey])) ev[currentKey] = [];
        ev[currentKey].push(listMatch[1]);
        continue;
      }
      const kvMatch = line.match(/^(\w+):\s?(.*)$/);
      if (kvMatch) {
        const [, k, v] = kvMatch;
        currentKey = k;
        if (v === '[]') { ev[k] = []; }
        else if (v === 'true') { ev[k] = true; }
        else if (v === 'false') { ev[k] = false; }
        else if (v.startsWith('"') && v.endsWith('"')) {
          try { ev[k] = JSON.parse(v); } catch { ev[k] = v; }
        }
        else { ev[k] = v; }
      }
    }
    return ev;
  }

  async function exportAllMarkdown() {
    const events = await getAllEvents();
    return events.map(ev => ({ name: `${ev.id}.md`, content: eventToMarkdown(ev) }));
  }

  async function importMarkdownFiles(files) {
    const results = [];
    for (const { content } of files) {
      const ev = markdownToEvent(content);
      if (ev) { await saveEvent(ev); results.push(ev); }
    }
    return results;
  }

  return {
    open, getAllEvents, getEvent, saveEvent, deleteEvent, clearAllEvents,
    getSetting, setSetting,
    eventToMarkdown, markdownToEvent, exportAllMarkdown, importMarkdownFiles
  };
})();
