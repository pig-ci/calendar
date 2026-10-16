/* Payas Days — Main application */
(async () => {
  await Storage.open();
  await Events.load();
  await Events.scheduleAllReminders();
  await loadTheme();
  initColorPicker();
  initTimezones();
  initNavLinks();
  initViewButtons();
  initNavControls();
  initFab();
  initEventForm();
  initSearch();
  initPopover();
  Calendar.on('eventClick', showEventPopover);
  Calendar.on('dayClick', d => openNewEventModal(d));
  Calendar.render();
  updateNavDate();

  /* ========================= Theme ========================= */
  async function loadTheme() {
    const saved = await Storage.getSetting('theme', null);
    if (saved) {
      applyTheme(saved);
    } else {
      // No explicit preference saved — honour OS setting
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('#btnTheme .pd-theme-icon i');
    if (icon) { icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'; }
  }
  document.getElementById('btnTheme').addEventListener('click', async () => {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    await Storage.setSetting('theme', next);
  });

  // Also listen for system preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async e => {
    const saved = await Storage.getSetting('theme', null);
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ========================= Nav controls ========================= */
  function updateNavDate() {
    const el = document.getElementById('navDateDisplay');
    if (el) el.textContent = Calendar.titleLabel();
  }
  function initNavControls() {
    document.getElementById('btnPrev').addEventListener('click', () => { Calendar.navigate(-1); Calendar.render(); updateNavDate(); });
    document.getElementById('btnNext').addEventListener('click', () => { Calendar.navigate(1); Calendar.render(); updateNavDate(); });
    document.getElementById('btnToday').addEventListener('click', () => { Calendar.setDate(new Date()); Calendar.render(); updateNavDate(); });
    document.getElementById('btnTodayPill')?.addEventListener('click', () => { Calendar.setDate(new Date()); Calendar.render(); updateNavDate(); });
    document.getElementById('brandHomeLink')?.addEventListener('click', e => { e.preventDefault(); showCalendarView(); });

    // Mobile menu toggle
    const menuBtn = document.getElementById('btnMobileMenu');
    const mobileMenu = document.getElementById('pdMobileMenu');
    menuBtn?.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    // Close mobile menu on outside click
    document.addEventListener('click', e => {
      if (mobileMenu?.classList.contains('open') && !mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuBtn.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Keyboard nav: arrow keys
    document.addEventListener('keydown', ev => {
      if (ev.target.closest('input, textarea, select, [contenteditable]')) return;
      if (ev.key === 'ArrowLeft') { Calendar.navigate(-1); Calendar.render(); updateNavDate(); }
      if (ev.key === 'ArrowRight') { Calendar.navigate(1); Calendar.render(); updateNavDate(); }
      if (ev.key === 't' || ev.key === 'T') { Calendar.setDate(new Date()); Calendar.render(); updateNavDate(); }
    });
  }

  /* ========================= View buttons ========================= */
  function initViewButtons() {
    document.querySelectorAll('.pd-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        document.querySelectorAll('.pd-view-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.pd-view-btn[data-view="${view}"]`).forEach(b => b.classList.add('active'));
        Calendar.setView(view);
        showCalendarView();
        Calendar.render();
        updateNavDate();
      });
    });
  }

  function showCalendarView() {
    document.getElementById('calendarView').classList.remove('d-none');
    document.getElementById('pageView').classList.add('d-none');
    document.getElementById('pageView').innerHTML = '';
    setActivePageLink(null);
  }

  /* ========================= Nav page links ========================= */
  function initNavLinks() {
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', ev => {
        ev.preventDefault();
        const page = link.dataset.page;
        showPage(page);
        // Close mobile menu if open
        const mobileMenu = document.getElementById('pdMobileMenu');
        const menuBtn = document.getElementById('btnMobileMenu');
        mobileMenu?.classList.remove('open');
        menuBtn?.classList.remove('open');
        mobileMenu?.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function setActivePageLink(name) {
    document.querySelectorAll('.pd-page-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === name);
    });
  }

  function showPage(name) {
    document.getElementById('calendarView').classList.add('d-none');
    const pv = document.getElementById('pageView');
    pv.classList.remove('d-none');
    if (name === 'settings') pv.innerHTML = renderSettingsPage();
    else if (name === 'about') pv.innerHTML = renderAboutPage();
    else if (name === 'license') pv.innerHTML = renderLicensePage();
    setActivePageLink(name);
    initPageActions(name);
  }

  /* ========================= Settings page ========================= */
  function renderSettingsPage() {
    return `
    <div class="pd-page">
      <h2><i class="fa-solid fa-gear me-2"></i>設定</h2>
      <p>設定 Payas Days 的偏好並管理資料。</p>
      <hr/>

      <h3>外觀</h3>
      <div class="pd-setting-row">
        <div><div class="pd-setting-label">佈景主題</div><div class="pd-setting-sub">淺色或深色模式</div></div>
        <select class="form-select pd-input" id="settingTheme" style="width:140px">
          <option value="light">淺色</option>
          <option value="dark">深色</option>
        </select>
      </div>

      <h3>通知</h3>
      <div class="pd-setting-row">
        <div><div class="pd-setting-label">瀏覽器通知</div><div class="pd-setting-sub">需要授予瀏覽器通知權限</div></div>
        <button class="btn pd-btn-ghost" id="btnRequestNotif"><i class="fa-solid fa-bell me-1"></i>啟用</button>
      </div>

      <h3>匯入與匯出</h3>
      <div class="row g-3 mb-3">
        <div class="col-sm-6">
          <button class="btn pd-btn-ghost w-100" id="btnExportICS"><i class="fa-solid fa-file-export me-1"></i>匯出 ICS</button>
        </div>
        <div class="col-sm-6">
          <button class="btn pd-btn-ghost w-100" id="btnExportMD"><i class="fa-solid fa-file-export me-1"></i>匯出 Markdown 檔案集</button>
        </div>
        <div class="col-sm-6">
          <label class="pd-import-area w-100" id="importICSLabel">
            <i class="fa-solid fa-file-import fa-lg d-block mb-2"></i>
            <span>匯入 ICS／.ics 檔案</span>
            <input type="file" id="importICSInput" accept=".ics,text/calendar" class="d-none" />
          </label>
        </div>
        <div class="col-sm-6">
          <label class="pd-import-area w-100" id="importMDLabel">
            <i class="fa-solid fa-file-import fa-lg d-block mb-2"></i>
            <span>匯入 Markdown 事件（.md 檔案）</span>
            <input type="file" id="importMDInput" accept=".md,text/markdown" multiple class="d-none" />
          </label>
        </div>
      </div>

      <h3>危險操作</h3>
      <div class="pd-setting-row">
        <div><div class="pd-setting-label" style="color:#dc2626">刪除所有事件</div><div class="pd-setting-sub">此操作無法復原</div></div>
        <button class="btn pd-btn-danger" id="btnClearAll">全部清除</button>
      </div>
    </div>`;
  }

  function initPageActions(name) {
    if (name === 'settings') {
      // Theme setting
      const themeEl = document.getElementById('settingTheme');
      if (themeEl) {
        themeEl.value = document.documentElement.getAttribute('data-theme') || 'light';
        themeEl.addEventListener('change', async () => {
          applyTheme(themeEl.value);
          await Storage.setSetting('theme', themeEl.value);
        });
      }
      // Notifications
      const notifBtn = document.getElementById('btnRequestNotif');
      if (notifBtn && 'Notification' in window) {
        const updateNotifBtn = perm => {
          if (perm === 'granted') {
            notifBtn.innerHTML = '<i class="fa-solid fa-bell me-1"></i>已啟用';
            notifBtn.disabled = true;
          } else if (perm === 'denied') {
            notifBtn.innerHTML = '<i class="fa-solid fa-bell-slash me-1"></i>已在瀏覽器中封鎖';
            notifBtn.disabled = true;
          }
        };
        updateNotifBtn(Notification.permission);
        notifBtn.addEventListener('click', async () => {
          const perm = await Notification.requestPermission();
          updateNotifBtn(perm);
          if (perm === 'granted') await Events.scheduleAllReminders();
        });
      }
      // Export ICS
      document.getElementById('btnExportICS')?.addEventListener('click', async () => {
        const evs = Events.getAll();
        const ics = ICS.exportICS(evs);
        downloadText(ics, 'payas-days.ics', 'text/calendar');
      });
      // Export MD
      document.getElementById('btnExportMD')?.addEventListener('click', async () => {
        const files = await Storage.exportAllMarkdown();
        if (files.length === 0) { alert('目前沒有可匯出的事件。'); return; }
        // Bundle as one text file with separators
        const bundle = files.map(f => `# FILE: ${f.name}\n\n${f.content}`).join('\n\n---\n\n');
        downloadText(bundle, 'payas-days-events.md', 'text/markdown');
      });
      // Import ICS
      document.getElementById('importICSInput')?.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const imported = ICS.importICS(text);
        for (const ev of imported) await Events.save(ev);
        await Events.load();
        alert(`成功匯入 ${imported.length} 個事件。`);
        showPage('settings');
      });
      // Import MD
      document.getElementById('importMDInput')?.addEventListener('change', async e => {
        const files = [...e.target.files];
        const fileObjs = await Promise.all(files.map(async f => ({ name: f.name, content: await f.text() })));
        const imported = await Storage.importMarkdownFiles(fileObjs);
        await Events.load();
        alert(`成功匯入 ${imported.length} 個事件。`);
        showPage('settings');
      });
      // Drag-drop import
      ['importICSLabel','importMDLabel'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
        el.addEventListener('drop', e => {
          e.preventDefault(); el.classList.remove('drag-over');
          const input = el.querySelector('input[type=file]');
          if (input && e.dataTransfer.files.length) {
            // Trigger same handler via FileList
            Object.defineProperty(input, 'files', { value: e.dataTransfer.files, configurable: true });
            input.dispatchEvent(new Event('change'));
          }
        });
      });
      // Clear all
      document.getElementById('btnClearAll')?.addEventListener('click', async () => {
        if (!confirm('確定要刪除所有事件嗎？此操作無法復原。')) return;
        await Storage.clearAllEvents();
        await Events.load();
        alert('所有事件已刪除。');
      });
    }
  }

  /* ========================= About page ========================= */
  function renderAboutPage() {
    return `
    <div class="pd-page">
      <h2 style="font-family:'Fraunces',serif;color:var(--accent)"><i class="fa-regular fa-calendar-days me-2"></i>Payas Days</h2>
      <p style="color:var(--text-3);font-size:12px;font-family:'JetBrains Mono',monospace">v1.0.0 · 日曆</p>
      <p>Payas Days 是一款響應式、重視隱私的網頁日曆，完全在瀏覽器中執行，不需要伺服器。事件會使用 IndexedDB 儲存在本機，並可匯出為 Markdown 或標準 ICS 格式。</p>
      <hr/>
      <h3>功能</h3>
      <ul>
        <li>月、週、日與議程檢視</li>
        <li>支援 iCalendar RRULE 的重複事件</li>
        <li>深色與淺色主題，並可偵測系統偏好</li>
        <li>ICS 匯入與匯出（相容 Google 日曆、Outlook）</li>
        <li>匯出 Markdown 檔案，方便攜帶與保存</li>
        <li>透過瀏覽器通知接收事件提醒</li>
        <li>無須帳號；事件資料儲存於本機</li>
      </ul>
      <hr/>
      <h3>開發者</h3>
      <p>
        <strong>Saman Wijesinghe</strong><br/>
        <span style="color:var(--pd-text-muted)">全端開發者暨開源軟體愛好者</span>
      </p>
      <hr/>
      <h3>技術</h3>
      <ul>
        <li>原生 JavaScript（ES2022）</li>
        <li>Bootstrap 5.3 · Font Awesome 6.5</li>
        <li>使用 IndexedDB 儲存本機資料</li>
        <li>使用 Markdown 與 YAML front matter 序列化事件</li>
        <li>使用 iCalendar（RFC 5545）匯入／匯出 ICS</li>
      </ul>
    </div>`;
  }

  /* ========================= License page ========================= */
  function renderLicensePage() {
    return `
    <div class="pd-page">
      <h2><i class="fa-solid fa-file-lines me-2"></i>授權條款</h2>
      <p style="color:var(--pd-text-muted);font-size:12px;">MIT License（英文原文）</p>
      <hr/>
      <pre style="white-space:pre-wrap;font-size:13px;color:var(--pd-text-secondary);line-height:1.7">MIT License

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
SOFTWARE.</pre>
    </div>`;
  }

  /* ========================= FAB ========================= */
  function initFab() {
    document.getElementById('btnFab').addEventListener('click', () => openNewEventModal(new Date()));
  }

  /* ========================= Color picker ========================= */
  function initColorPicker() {
    const picker = document.getElementById('colorPicker');
    if (!picker) return;
    const colorLabels = {
      blue: '藍色', teal: '藍綠色', green: '綠色', yellow: '黃色', orange: '橘色',
      red: '紅色', pink: '粉紅色', purple: '紫色', gray: '灰色', indigo: '靛藍色',
    };
    picker.innerHTML = '';
    for (const [name, hex] of Object.entries(Events.EVENT_COLORS)) {
      const sw = document.createElement('div');
      sw.className = 'pd-color-swatch' + (name === 'blue' ? ' active' : '');
      sw.style.background = hex;
      sw.dataset.color = name;
      sw.title = colorLabels[name] || name;
      sw.addEventListener('click', () => {
        picker.querySelectorAll('.pd-color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      });
      picker.appendChild(sw);
    }
  }

  function getSelectedColor() {
    return document.querySelector('#colorPicker .pd-color-swatch.active')?.dataset.color || 'blue';
  }
  function setSelectedColor(color) {
    document.querySelectorAll('#colorPicker .pd-color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === color);
    });
  }

  /* ========================= Timezones ========================= */
  function initTimezones() {
    const sel = document.getElementById('evTimezone');
    if (!sel) return;
    const zones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
      'UTC','America/New_York','America/Los_Angeles','America/Chicago','Europe/London',
      'Europe/Paris','Asia/Tokyo','Asia/Colombo','Asia/Kolkata','Australia/Sydney'
    ];
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    sel.innerHTML = zones.map(z => `<option value="${z}"${z===local?' selected':''}>${z}</option>`).join('');
  }

  /* ========================= Event form ========================= */
  let editingEventId = null;

  function openNewEventModal(date) {
    editingEventId = null;
    document.getElementById('eventModalLabel').innerHTML = '<i class="fa-solid fa-calendar-plus me-2"></i>新增事件';
    document.getElementById('btnDeleteEvent').classList.add('d-none');
    document.getElementById('btnExportEvent').classList.add('d-none');
    resetForm();

    // Pre-fill date
    const d = date || new Date();
    const start = new Date(d); start.setMinutes(0,0,0);
    const end = new Date(start); end.setHours(end.getHours() + 1);
    document.getElementById('evStart').value = toLocalISO(start);
    document.getElementById('evEnd').value = toLocalISO(end);

    new bootstrap.Modal(document.getElementById('eventModal')).show();
  }

  function openEditModal(id) {
    const ev = Events.getById(id);
    if (!ev) return;
    editingEventId = id;
    document.getElementById('eventModalLabel').innerHTML = '<i class="fa-solid fa-pen me-2"></i>編輯事件';
    document.getElementById('btnDeleteEvent').classList.remove('d-none');
    document.getElementById('btnExportEvent').classList.remove('d-none');

    document.getElementById('evTitle').value = ev.title || '';
    document.getElementById('evDescription').value = ev.description || '';
    document.getElementById('evLocation').value = ev.location || '';
    document.getElementById('evLabel').value = ev.label || '';

    const allDay = ev.allDay || false;
    document.getElementById('evAllDay').checked = allDay;
    toggleAllDay(allDay);

    if (allDay) {
      document.getElementById('evStartDate').value = (ev.start || '').slice(0,10);
      document.getElementById('evEndDate').value = (ev.end || '').slice(0,10);
    } else {
      document.getElementById('evStart').value = toLocalISO(new Date(ev.start));
      document.getElementById('evEnd').value = toLocalISO(new Date(ev.end));
    }

    const tz = document.getElementById('evTimezone');
    if (tz && ev.timezone) tz.value = ev.timezone;

    setSelectedColor(ev.color || 'blue');

    const recSel = document.getElementById('evRecurrence');
    const rruleInput = document.getElementById('evRrule');
    const knownRules = Array.from(recSel.options).map(o => o.value);
    if (ev.recurrence && !knownRules.includes(ev.recurrence)) {
      recSel.value = 'custom';
      rruleInput.classList.remove('d-none');
      rruleInput.value = ev.recurrence;
    } else {
      recSel.value = ev.recurrence || '';
      rruleInput.classList.add('d-none');
    }

    renderTagList('reminderList', ev.reminders || [], '分鐘前');
    renderTagList('attendeeList', ev.attendees || [], '');
    renderTagList('attachmentList', ev.attachments || [], '');

    new bootstrap.Modal(document.getElementById('eventModal')).show();
  }

  function initEventForm() {
    document.getElementById('evAllDay').addEventListener('change', e => toggleAllDay(e.target.checked));
    document.getElementById('evRecurrence').addEventListener('change', e => {
      document.getElementById('evRrule').classList.toggle('d-none', e.target.value !== 'custom');
    });

    document.getElementById('btnAddReminder').addEventListener('click', () => {
      const mins = parseInt(document.getElementById('reminderMinutes').value, 10);
      if (!mins || mins < 1) return;
      addTagToList('reminderList', String(mins), '分鐘前');
      document.getElementById('reminderMinutes').value = '';
    });
    document.getElementById('btnAddAttendee').addEventListener('click', () => {
      const val = document.getElementById('attendeeInput').value.trim();
      if (!val) return;
      addTagToList('attendeeList', val, '');
      document.getElementById('attendeeInput').value = '';
    });
    document.getElementById('btnAddAttachment').addEventListener('click', () => {
      const val = document.getElementById('attachmentInput').value.trim();
      if (!val) return;
      addTagToList('attachmentList', val, '');
      document.getElementById('attachmentInput').value = '';
    });

    document.getElementById('btnSaveEvent').addEventListener('click', saveEventFromForm);

    document.getElementById('btnDeleteEvent').addEventListener('click', async () => {
      if (!editingEventId) return;
      if (!confirm('確定要刪除此事件嗎？')) return;
      await Events.remove(editingEventId);
      bootstrap.Modal.getInstance(document.getElementById('eventModal'))?.hide();
      Calendar.render();
    });

    document.getElementById('btnExportEvent').addEventListener('click', () => {
      if (!editingEventId) return;
      const ev = Events.getById(editingEventId);
      if (!ev) return;
      const md = Storage.eventToMarkdown(ev);
      downloadText(md, `${ev.id}.md`, 'text/markdown');
    });
  }

  function toggleAllDay(isAllDay) {
    document.getElementById('startDateWrap').style.display = isAllDay ? 'none' : '';
    document.getElementById('endDateWrap').style.display = isAllDay ? 'none' : '';
    document.getElementById('startDateOnlyWrap').style.display = isAllDay ? '' : 'none';
    document.getElementById('endDateOnlyWrap').style.display = isAllDay ? '' : 'none';
  }

  function resetForm() {
    document.getElementById('eventForm').reset();
    document.getElementById('evRrule').classList.add('d-none');
    toggleAllDay(false);
    document.getElementById('reminderList').innerHTML = '';
    document.getElementById('attendeeList').innerHTML = '';
    document.getElementById('attachmentList').innerHTML = '';
    setSelectedColor('blue');
    const tz = document.getElementById('evTimezone');
    if (tz) tz.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  async function saveEventFromForm() {
    const title = document.getElementById('evTitle').value.trim();
    if (!title) { document.getElementById('evTitle').focus(); return; }

    const allDay = document.getElementById('evAllDay').checked;
    let start, end;
    if (allDay) {
      const startDateVal = document.getElementById('evStartDate').value;
      const endDateVal = document.getElementById('evEndDate').value;
      if (!startDateVal || !endDateVal) { alert('請設定開始與結束日期。'); return; }
      if (endDateVal < startDateVal) { alert('結束日期不可早於開始日期。'); return; }
      start = startDateVal + 'T00:00:00';
      end = endDateVal + 'T23:59:59';
    } else {
      start = document.getElementById('evStart').value;
      end = document.getElementById('evEnd').value;
    }
    if (!start || !end) { alert('請設定開始與結束日期／時間。'); return; }
    if (new Date(end) <= new Date(start)) { alert('結束時間必須晚於開始時間。'); return; }

    const rruleSel = document.getElementById('evRecurrence').value;
    const rruleCustom = document.getElementById('evRrule').value.trim();
    const recurrence = rruleSel === 'custom' ? rruleCustom : rruleSel;

    const ev = {
      id: editingEventId || undefined,
      title,
      description: document.getElementById('evDescription').value.trim(),
      start,
      end,
      allDay,
      timezone: document.getElementById('evTimezone').value,
      location: document.getElementById('evLocation').value.trim(),
      color: getSelectedColor(),
      label: document.getElementById('evLabel').value.trim(),
      recurrence,
      reminders: getTagValues('reminderList').map(Number).filter(Boolean),
      attendees: getTagValues('attendeeList'),
      attachments: getTagValues('attachmentList'),
    };

    // Conflict detection
    const conflicts = Events.detectConflicts(ev);
    if (conflicts.length > 0) {
      const names = conflicts.map(c => c.title || '未命名事件').join('、');
      if (!confirm(`此事件與下列事件時間重疊：${names}。仍要儲存嗎？`)) return;
    }

    await Events.save(ev);
    bootstrap.Modal.getInstance(document.getElementById('eventModal'))?.hide();
    Calendar.render();
  }

  /* ========================= Tag lists ========================= */
  function addTagToList(containerId, value, suffix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const chip = document.createElement('span');
    chip.className = 'pd-tag-chip';
    chip.innerHTML = `${value}${suffix ? ' <em>' + suffix + '</em>' : ''} <span class="remove-tag" title="移除">&times;</span>`;
    chip.dataset.value = value;
    chip.querySelector('.remove-tag').addEventListener('click', () => chip.remove());
    container.appendChild(chip);
  }

  function renderTagList(containerId, values, suffix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    values.forEach(v => addTagToList(containerId, v, suffix));
  }

  function getTagValues(containerId) {
    return [...document.querySelectorAll(`#${containerId} .pd-tag-chip`)].map(c => c.dataset.value);
  }

  /* ========================= Event Popover ========================= */
  function initPopover() {
    document.getElementById('popClose').addEventListener('click', closePopover);
    document.getElementById('popEdit').addEventListener('click', () => {
      const id = document.getElementById('eventPopover').dataset.eventId;
      closePopover();
      openEditModal(id);
    });
    document.getElementById('popDelete').addEventListener('click', async () => {
      const id = document.getElementById('eventPopover').dataset.eventId;
      if (!confirm('確定要刪除此事件嗎？')) return;
      await Events.remove(id);
      closePopover();
      Calendar.render();
    });
    document.addEventListener('click', e => {
      const pop = document.getElementById('eventPopover');
      if (!pop.classList.contains('d-none') && !pop.contains(e.target)) closePopover();
    });
  }

  function showEventPopover(id, anchorEl) {
    const ev = Events.getById(id);
    if (!ev) return;

    const pop = document.getElementById('eventPopover');
    pop.dataset.eventId = id;
    document.getElementById('popColor').style.background = Events.colorHex(ev.color);
    document.getElementById('popTitle').textContent = ev.title || '未命名事件';

    let body = '';
    const s = new Date(ev.start);
    if (ev.allDay) {
      body += `<div class="pd-popover-row"><i class="fa-regular fa-calendar"></i><span>${s.toLocaleDateString('zh-TW')}</span></div>`;
    } else {
      body += `<div class="pd-popover-row"><i class="fa-regular fa-clock"></i><span>${s.toLocaleDateString('zh-TW')} ${Calendar.fmtTime(ev.start)} – ${Calendar.fmtTime(ev.end)}</span></div>`;
    }
    if (ev.location) body += `<div class="pd-popover-row"><i class="fa-solid fa-location-dot"></i><span>${escapeHTML(ev.location)}</span></div>`;
    if (ev.recurrence) body += `<div class="pd-popover-row"><i class="fa-solid fa-repeat"></i><span>${escapeHTML(ev.recurrence)}</span></div>`;
    if (ev.description) body += `<div class="pd-popover-row"><i class="fa-regular fa-file-lines"></i><span style="white-space:pre-wrap">${escapeHTML(ev.description.slice(0, 120))}</span></div>`;
    if (ev.label) body += `<div class="pd-popover-row"><i class="fa-solid fa-tag"></i><span>${escapeHTML(ev.label)}</span></div>`;
    document.getElementById('popBody').innerHTML = body;

    // Position near anchor
    pop.classList.remove('d-none');
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = rect.left;
      if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
      if (top + 200 > window.innerHeight) top = rect.top - 210;
      pop.style.top = top + 'px';
      pop.style.left = left + 'px';
    }
  }

  function closePopover() {
    document.getElementById('eventPopover').classList.add('d-none');
  }

  /* ========================= Search ========================= */
  function closeSearch() {
    const bar = document.getElementById('searchBar');
    const btn = document.getElementById('btnSearch');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    bar.classList.remove('open');
    bar.setAttribute('aria-hidden', 'true');
    btn.classList.remove('active');
    input.value = '';
    results.innerHTML = '';
  }

  function initSearch() {
    const btn = document.getElementById('btnSearch');
    const bar = document.getElementById('searchBar');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    btn.addEventListener('click', () => {
      const opening = !bar.classList.contains('open');
      if (opening) {
        bar.classList.add('open');
        bar.setAttribute('aria-hidden', 'false');
        btn.classList.add('active');
        setTimeout(() => input.focus(), 120);
      } else {
        closeSearch();
      }
    });

    document.getElementById('btnSearchClose').addEventListener('click', closeSearch);

    // Press / to open search
    document.addEventListener('keydown', ev => {
      if (ev.key === '/' && !ev.target.closest('input, textarea, select, [contenteditable]')) {
        ev.preventDefault();
        bar.classList.add('open');
        bar.setAttribute('aria-hidden', 'false');
        btn.classList.add('active');
        setTimeout(() => input.focus(), 120);
      }
      if (ev.key === 'Escape' && bar.classList.contains('open')) closeSearch();
    });

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const q = input.value.trim();
        if (!q) { results.innerHTML = ''; return; }
        const found = Events.search(q);
        results.innerHTML = '';
        if (!found.length) {
          results.innerHTML = '<div class="pd-search-result-item" style="color:var(--pd-text-muted)">找不到符合的事件。</div>';
        } else {
          found.slice(0, 20).forEach(ev => {
            const item = document.createElement('div');
            item.className = 'pd-search-result-item';
            item.innerHTML = `
              <div style="display:flex;align-items:center;gap:8px">
                <span style="width:10px;height:10px;border-radius:50%;background:${escapeHTML(Events.colorHex(ev.color))};flex-shrink:0;display:inline-block"></span>
                <span style="font-weight:500">${escapeHTML(ev.title || '未命名事件')}</span>
                <span style="font-size:11px;color:var(--pd-text-muted);margin-left:auto">${new Date(ev.start).toLocaleDateString('zh-TW')}</span>
              </div>
              ${ev.location ? `<div style="font-size:12px;color:var(--pd-text-muted);margin-left:18px"><i class="fa-solid fa-location-dot me-1"></i>${escapeHTML(ev.location)}</div>` : ''}`;
            item.addEventListener('click', () => {
              Calendar.setDate(new Date(ev.start));
              Calendar.setView('day');
              document.querySelectorAll('.pd-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'day'));
              showCalendarView();
              Calendar.render();
              updateNavDate();
              closeSearch();
              setTimeout(() => showEventPopover(ev.id, document.querySelector(`[data-id="${ev.id}"]`)), 200);
            });
            results.appendChild(item);
          });
        }
      }, 200);
    });
  }

  /* ========================= Utilities ========================= */
  function escapeHTML(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toLocalISO(d) {
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function downloadText(text, filename, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Seed sample events on first load
  const seeded = await Storage.getSetting('seeded', false);
  if (!seeded) {
    const now = new Date();
    const fmt = (d) => d.toISOString();
    const today8 = new Date(now); today8.setHours(9,0,0,0);
    const today9 = new Date(now); today9.setHours(10,0,0,0);
    const tomorrow14 = new Date(now); tomorrow14.setDate(tomorrow14.getDate()+1); tomorrow14.setHours(14,0,0,0);
    const tomorrow15 = new Date(now); tomorrow15.setDate(tomorrow15.getDate()+1); tomorrow15.setHours(15,30,0,0);

    await Events.save({ title: '歡迎使用 Payas Days！', description: '這是重視隱私的個人日曆。你可以在此建立、編輯與管理事件，使用右下角的「＋」按鈕新增事件。', start: fmt(today8), end: fmt(today9), allDay: false, color: 'blue', label: '歡迎', recurrence: '', reminders: [], attendees: [], attachments: [] });
    await Events.save({ title: '團隊會議', description: '每週同步會議', start: fmt(tomorrow14), end: fmt(tomorrow15), allDay: false, color: 'teal', label: '工作', recurrence: 'FREQ=WEEKLY;BYDAY=MO', reminders: [10], attendees: [], attachments: [], location: '會議室 A' });

    await Storage.setSetting('seeded', true);
    await Events.load();
    Calendar.render();
  }
})();
