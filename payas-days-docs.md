# Payas Days — 使用與開發文件

> 重視隱私的瀏覽器日曆 · 不需伺服器 · 開放原始碼
> 開發者：**Saman Wijesinghe** · 授權：MIT

---

## 目錄

1. [專案概述](#1-專案概述)
2. [快速開始](#2-快速開始)
3. [日曆檢視](#3-日曆檢視)
4. [事件管理](#4-事件管理)
5. [介面操作指南](#5-介面操作指南)
6. [設定說明](#6-設定說明)
7. [鍵盤快捷鍵](#7-鍵盤快捷鍵)
8. [儲存與資料](#8-儲存與資料)
9. [架構與程式碼結構](#9-架構與程式碼結構)
10. [CSS 設計系統](#10-css-設計系統)
11. [JavaScript API 參考](#11-javascript-api-參考)
12. [資料結構](#12-資料結構)
13. [貢獻方式](#13-貢獻方式)
14. [授權條款](#14-授權條款)

---

## 1. 專案概述

**Payas Days** 是完全在用戶端執行的網頁日曆，不需要伺服器、帳號或建置步驟。開啟 `index.html` 即可開始安排日程。所有資料都儲存在本機 IndexedDB，並可匯出為標準 ICS 或可攜式 Markdown 檔案。

### 專案資訊

| 項目 | 內容 |
|---|---|
| 入口檔案 | `index.html` |
| 技術 | HTML5 · CSS3 · 原生 JavaScript（ES2022） |
| 相依套件 | Bootstrap 5.3 · Font Awesome 6.5 · Google Fonts |
| 儲存 | IndexedDB（持久儲存）· ICS 與 Markdown 匯入／匯出 |
| 檢視模式 | 月 · 週 · 日 · 議程 |
| 瀏覽器支援 | Chromium 核心瀏覽器 · Firefox |
| 佈景主題 | 淺色與深色模式（可依系統偏好設定） |
| 響應式介面 | 桌面與行動裝置 |

### 設計語言

Payas Days 採用 Payas 系列網頁工具（Reader、Editor、Player、Imager、FM、Omi）共用的 **Payas 設計系統**，沿用相同的色彩變數、字體與元件樣式。

---

## 2. 快速開始

不需要建置。可直接開啟入口檔案：

```bash
# 方法一：直接開啟
xdg-open payas-days/index.html          # Linux
open payas-days/index.html              # macOS
start payas-days/index.html             # Windows

# 方法二：啟動本機伺服器（避免 file:// 相容性問題）
npx serve .
python3 -m http.server 8080
```

接著在瀏覽器前往 `http://localhost:8080/`。

### 首次使用

1. 在瀏覽器中開啟 `index.html`。
2. 系統會自動建立兩筆示範事件。
3. 點擊右下角的 **＋** 浮動按鈕新增事件。
4. 在月檢視中點擊日期格，即可建立該日的事件。
5. 點擊事件標籤可開啟快速詳細資訊，並進行編輯或刪除。

---

## 3. 日曆檢視

使用標題列下方的分頁列切換檢視模式。

### 月檢視

顯示當月完整日曆格線。每格最多顯示 3 個事件標籤；若事件更多，會顯示 **＋N 個更多**。相鄰月份的日期會以淡色呈現，今天則會特別標示。

- 點擊日期格 → 開啟已填入該日期的新事件視窗。
- 點擊事件標籤 → 開啟事件詳細資訊。
- 導覽：按 `←`／`→` 一次移動一個月。

### 週檢視

以時間格線顯示本週 7 天，縱軸為 24 小時制。每天各佔一欄，事件的位置與高度依開始及結束時間計算（最小高度為 15 分鐘）。今天的欄位會以紅色 **目前時間線** 標示現在時間。

- 載入後會自動捲動至上午 8 點。
- 點擊日期標題 → 切換至該日的日檢視。
- 導覽：按 `←`／`→` 一次移動一週。

### 日檢視

以與週檢視相同的時間格線顯示單日行程，並在標題顯示完整日期。檢視今天時會顯示目前時間線。

- 導覽：按 `←`／`→` 一次移動一天。

### 議程檢視

依日期分組顯示目前日期起未來 **30 天** 的事件。每組先顯示日期，再列出事件時間與地點；沒有事件時會顯示提示訊息。

- 導覽：按 `←`／`→` 一次移動 30 天。
- 每日事件依時間先後排序。

---

## 4. 事件管理

### 建立事件

- **浮動新增按鈕**（`+`）— 開啟空白事件視窗，預設為目前時間的整點，事件長度為 1 小時。
- **點擊日期格**（月檢視）— 開啟已填入所選日期的空白視窗。
- **點擊日期標題**（週檢視）— 切換至該日期的日檢視。

### 事件欄位

| 欄位 | 說明 |
|---|---|
| **標題** | 必填，純文字。 |
| **全天** | 切換開關；啟用後日期欄位會改為僅選日期。 |
| **開始／結束** | 使用 `datetime-local` 欄位；全天事件則改用 `date` 欄位。 |
| **描述** | 多行文字，支援 Markdown，內容會原樣儲存。 |
| **地點** | 可輸入文字或網址，會顯示於詳細資訊與議程項目。 |
| **時區** | 選單內容取自 `Intl.supportedValuesOf('timeZone')`，預設為本機時區。 |
| **顏色** | 10 種色票，用於事件標籤及詳細資訊的色點。 |
| **標籤** | 自由輸入的分類文字（例如 `工作`、`私人`），可供搜尋。 |
| **重複** | 可選預設週期，或輸入自訂 RRULE。 |
| **提醒** | 可設定一個或多個開始前分鐘數，並透過瀏覽器通知提醒。 |
| **參與者** | 可新增一個或多個電子郵件地址。 |
| **附件** | 可新增一個或多個網址。 |

### 編輯與刪除

點擊事件後會顯示詳細資訊，內含 **編輯**（鉛筆）與 **刪除**（垃圾桶）按鈕。

- **編輯**會開啟已填入事件資料的編輯視窗。
- 編輯視窗中的 **匯出 .md** 可將單一事件下載為 Markdown 檔案。
- **刪除**會先要求確認，再從 IndexedDB 移除事件。

### 衝突偵測

儲存事件時，Payas Days 會檢查是否與其他非全天事件重疊。若有衝突，確認視窗會列出事件標題，讓你選擇仍要儲存或取消。

### 重複事件

支援的 RRULE 預設值：

| 選項 | RRULE 值 |
|---|---|
| 不重複 | *(空值)* |
| 每天 | `FREQ=DAILY` |
| 每週 | `FREQ=WEEKLY` |
| 每個工作日（週一至週五） | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| 每月 | `FREQ=MONTHLY` |
| 每年 | `FREQ=YEARLY` |
| 自訂… | 自由輸入 RRULE 字串 |

重複事件會依各檢視的日期範圍**即時計算展開**。每次發生都是虛擬事件物件，具有組合式 `id`（`masterId_YYYY-MM-DD`）及回指主事件的 `_masterId`。編輯或刪除操作一律套用至主事件。

支援的 RRULE 部分：`FREQ`、`INTERVAL`、`COUNT`、`UNTIL`、`BYDAY`。
每次查詢最多展開 500 次事件。

### 提醒

取得瀏覽器通知權限後，Payas Days 會依每個提醒時間設定 `setTimeout`。載入頁面時，`scheduleAllReminders()` 會為所有事件重新註冊計時器。通知透過 Web Notifications API 發送，內容包含事件標題及提前分鐘數。計時器需要頁面保持開啟。

---

## 5. 介面操作指南

### 標題列

```
[ 📅 Payas Days  Calendar ]   [ ← Apr 2026 → ]   [ 🔍 ]  [ 🌙 ]  [ Settings ]  [ About ]  [ License ]
```

| 元素 | 操作 |
|---|---|
| **Payas Days** 品牌 | 在設定、關於或授權頁面點擊，可返回日曆。 |
| **← / →** 箭頭 | 依目前檢視模式的時間單位前後移動。 |
| **日期顯示**（中央） | 顯示目前日期範圍；點擊即可前往今天。 |
| **🔍 搜尋** | 開啟或關閉搜尋列；也可按 `/` 開啟。 |
| **🌙 / ☀️ 佈景主題** | 切換深色／淺色模式，設定會儲存至 IndexedDB。 |
| **設定／關於／授權條款** | 開啟對應頁面並隱藏日曆。 |
| **漢堡選單**（行動裝置） | 展開行動版導覽選單。 |

### 分頁列

```
[ Month ]  [ Week ]  [ Day ]  [ Agenda ]                               [ Today ]
```

- 檢視按鈕使用 `role=tab` 與 `aria-selected` 提供無障礙支援。
- 右側的 **今天** 按鈕可跳至目前日期。

### 搜尋列

啟用後會在標題列下方展開。搜尋所有事件的 `title`、`description`、`location` 與 `label` 欄位（不區分大小寫，延遲 200 毫秒執行），最多顯示 20 筆結果。點擊結果會切換至該事件日期的日檢視並開啟詳細資訊。

可點擊 `✕`、按 `Escape`，或再次點擊搜尋圖示關閉。

### 事件詳細資訊

詳細資訊浮窗會出現在所點擊的事件附近，顯示：

- 顏色標記與事件標題
- 日期與時間範圍（或「全天」）
- 地點（如有設定）
- 重複規則（如有設定）
- 描述預覽（最多 120 個字元）
- 標籤（如有設定）

按鈕：**編輯** · **刪除** · **關閉（✕）**。點擊浮窗外側會自動關閉。

### 浮動新增按鈕

固定在右下角的 `+` 按鈕會顯示於日曆上方，點擊即可開啟新增事件視窗。

---

## 6. 設定說明

透過導覽列的 **設定** 連結進入。

### 外觀

| 設定 | 選項 | 說明 |
|---|---|---|
| 佈景主題 | 淺色／深色 | 套用佈景主題並儲存至 IndexedDB。 |

### 通知

| 操作 | 說明 |
|---|---|
| **啟用** | 呼叫 `Notification.requestPermission()`；按鈕會依權限狀態更新。 |

### 匯入與匯出

| 操作 | 說明 |
|---|---|
| **匯出 ICS** | 將所有事件下載為 `payas-days.ics`（RFC 5545／iCalendar），相容 Google 日曆、Outlook 與 Apple 日曆。 |
| **匯出 Markdown 檔案集** | 將所有事件打包下載為 `payas-days-events.md`。每筆事件前會以 `# FILE: <id>.md` 標示檔名。 |
| **匯入 ICS** | 選取 `.ics` 檔案，解析並儲存所有 `VEVENT` 區塊；也支援拖放匯入。 |
| **匯入 Markdown 事件** | 可選取多個 `.md` 檔案，解析 YAML front matter 與本文；也支援拖放匯入。 |

### 危險操作

| 操作 | 說明 |
|---|---|
| **全部清除** | 從 IndexedDB 刪除所有事件。需要透過 `confirm()` 確認，且無法復原。 |

---

## 7. 鍵盤快捷鍵

| 快捷鍵 | 操作 |
|---|---|
| `←` | 向前回到上一個月／週／日／30 天區間 |
| `→` | 向後前往下一個月／週／日／30 天區間 |
| `T` | 前往今天 |
| `/` | 開啟搜尋列 |
| `Escape` | 關閉搜尋列 |

> 焦點位於 `input`、`textarea`、`select` 或 `[contenteditable]` 元素時，不會觸發快捷鍵。

---

## 8. 儲存與資料

### IndexedDB

所有資料都儲存在名為 `payas-days`（版本 1）的 IndexedDB 資料庫，內含兩個物件儲存區：

| 儲存區 | 索引鍵 | 索引 | 用途 |
|---|---|---|---|
| `events` | `id`（字串） | `start`、`label` | 事件記錄 |
| `settings` | `key`（字串） | — | 應用程式設定（佈景主題、示範資料初始化旗標） |

### 事件 ID

新事件會取得以下格式的 ID：

```
evt-<timestamp>-<5-char-random>
```

例如：`evt-1745200000000-a3k9f`

### Markdown 格式

每筆事件會序列化為含 YAML front matter 的 Markdown 檔案：

```markdown
---
id: evt-1745200000000-a3k9f
title: 團隊會議
start: 2026-04-20T14:00:00
end: 2026-04-20T15:30:00
allDay: false
timezone: Asia/Colombo
location: 會議室 A
attendees:
  - alice@example.com
color: teal
label: 工作
recurrence: FREQ=WEEKLY;BYDAY=MO
reminders:
  - 10
attachments: []
created: 2026-04-19T08:00:00.000Z
modified: 2026-04-19T08:00:00.000Z
---

與團隊進行每週同步會議。
```

`description` 欄位就是結尾 `---` 分隔線下方的 Markdown 本文。

### ICS 格式

匯出的 ICS 遵循 RFC 5545。參與者會寫成 `ATTENDEE:mailto:<email>`；提醒會轉為含 `TRIGGER:-PT<N>M` 的 `VALARM` 區塊；每行最多折行至 75 個字元。

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Payas Days//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:evt-1745200000000-a3k9f@payas-days
SUMMARY:團隊會議
DTSTART:20260420T140000
DTEND:20260420T153000
LOCATION:會議室 A
RRULE:FREQ=WEEKLY;BYDAY=MO
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:提醒
TRIGGER:-PT10M
END:VALARM
END:VEVENT
END:VCALENDAR
```

---

## 9. 架構與程式碼結構

Payas Days 是**多檔案靜態網頁應用程式**，不需要建置步驟或前端框架。

```
payas-days/
├── index.html          — 頁面標記：標題列、分頁列、檢視容器、對話框、浮動按鈕
├── css/
│   └── styles.css      — 樣式表（Payas 設計變數）
├── js/
│   ├── storage.js      — IndexedDB 介接、Markdown 序列化
│   ├── recurrence.js   — RRULE 展開器（DAILY/WEEKLY/MONTHLY/YEARLY）
│   ├── ics.js          — ICS（RFC 5545）匯入與匯出
│   ├── events.js       — CRUD 快取、衝突偵測、提醒
│   ├── calendar.js     — 月／週／日／議程檢視的繪製
│   └── app.js          — 佈景主題、導覽、表單、搜尋、浮窗與初始化
└── data/               — 範例資料
```

`index.html` 底部會依相依順序載入指令碼：

```
storage.js → recurrence.js → ics.js → events.js → calendar.js → app.js
```

`app.js` 將程式包在 `async IIFE` 中，並在其他初始化工作前等待 `Storage.open()` 完成。

### Module Pattern

每個 JS 檔案都公開單一 `const` 命名空間物件（例如 `Storage`、`Recurrence`、`ICS`、`Events`、`Calendar`）。內部函式與狀態透過閉包保持私有。專案沒有打包器或 ES module 匯入，而是依序透過 `<script>` 標籤載入全域物件。

### Page System

設定、關於與授權條款頁面會以 HTML 字串繪製後插入 `#pageView`。日曆檢視（`#calendarView`）則透過切換 Bootstrap 的 `d-none` 類別隱藏或顯示。`showCalendarView()` 與 `showPage(name)` 負責切換頁面。

### Rendering Model

日曆採用**命令式 DOM 繪製**：每次導覽或狀態變更時，對應的 `render*()` 函式會清空容器並重新建立內容。

| 函式 | 重建內容 |
|---|---|
| `renderMonth()` | 含事件標籤的 5 至 6 週格線 |
| `renderWeek()` | 7 欄時間格線與定位事件區塊 |
| `renderDay()` | 單欄時間格線 |
| `renderAgenda()` | 未來 30 天依日期分組的事件清單 |

週與日檢視會在繪製後透過 50 毫秒的 `setTimeout` 捲動至上午 8 點（自頂端 480 px；每分鐘 1 px）。

---

## 10. CSS 設計系統

Payas Days 在 `:root` 使用共用的 **Payas 設計變數**作為 CSS 自訂屬性。

### 色彩變數

#### 淺色模式（預設）

| 變數 | 值 | 用途 |
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

#### 深色模式（`[data-theme="dark"]`）

| 變數 | 值 |
|---|---|
| `--bg-app` | `#0f0f0e` |
| `--bg-bar` | `#191917` |
| `--bg-sidebar` | `#141412` |
| `--text-1` | `#e8e4d6` |
| `--text-2` | `#a4a099` |
| `--accent` | `#52b788` |
| `--border` | `#2a2a28` |

### 字體排版

| 用途 | 字體 | 大小 | 粗細 |
|---|---|---|---|
| 介面本文 | DM Sans | 13–14px | 400–500 |
| 品牌／標誌 | Fraunces（襯線） | 15px | 600 |
| 品牌副標 | Fraunces 斜體 | 11px | 400 |
| 數字／等寬文字 | JetBrains Mono | 10–11px | 400–500 |

### 事件色票

| 名稱 | Hex |
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

## 11. JavaScript API 參考

### Storage

| 函式 | 簽章 | 說明 |
|---|---|---|
| `open()` | `→ Promise<IDBDatabase>` | 開啟 IndexedDB 資料庫（或回傳快取的連線）；應用程式初始化時呼叫一次。 |
| `getAllEvents()` | `→ Promise<Event[]>` | 從 `events` 儲存區取得所有事件記錄。 |
| `getEvent(id)` | `(string) → Promise<Event>` | 依 ID 取得單筆事件。 |
| `saveEvent(event)` | `(Event) → Promise` | 新增或更新事件；若缺少 `id`、`created`、`modified`，會自動產生。 |
| `deleteEvent(id)` | `(string) → Promise` | 依 ID 刪除事件。 |
| `clearAllEvents()` | `→ Promise` | 清空整個 `events` 儲存區。 |
| `getSetting(key, fallback)` | `(string, any) → Promise<any>` | 讀取設定；找不到時回傳 `fallback`。 |
| `setSetting(key, value)` | `(string, any) → Promise` | 寫入設定值。 |
| `eventToMarkdown(ev)` | `(Event) → string` | 將事件序列化為含 YAML front matter 的 Markdown 字串。 |
| `markdownToEvent(md)` | `(string) → Event\|null` | 將 Markdown 字串解析為事件物件；解析失敗時回傳 `null`。 |
| `exportAllMarkdown()` | `→ Promise<{name,content}[]>` | 回傳所有已儲存事件的 `{ name: '<id>.md', content }` 陣列。 |
| `importMarkdownFiles(files)` | `({name,content}[]) → Promise<Event[]>` | 解析並儲存 Markdown 檔案物件陣列，回傳已儲存的事件。 |

### Events

| 函式 | 簽章 | 說明 |
|---|---|---|
| `load()` | `→ Promise<Event[]>` | 從 Storage 載入所有事件至記憶體快取。 |
| `save(ev)` | `(Event) → Promise<Event>` | 儲存事件、重新載入快取並安排提醒。 |
| `remove(id)` | `(string) → Promise` | 從 Storage 刪除事件並更新快取。 |
| `getAll()` | `→ Event[]` | 回傳記憶體中的快取陣列。 |
| `getById(id)` | `(string) → Event\|undefined` | 依 ID 從快取尋找事件。 |
| `getInRange(start, end)` | `(Date, Date) → Event[]` | 回傳與日期範圍重疊的事件，包含展開後的重複事件。 |
| `search(query)` | `(string) → Event[]` | 不區分大小寫搜尋標題、描述、地點與標籤。 |
| `detectConflicts(ev)` | `(Event) → Event[]` | 回傳與指定事件時間重疊的既有事件；全天事件不納入檢查。 |
| `scheduleAllReminders()` | `→ Promise` | 僅在已有通知權限時，為所有事件安排計時器。 |
| `colorHex(name)` | `(string) → string` | 依顏色名稱回傳十六進位色碼；找不到時使用 `EVENT_COLORS.blue`。 |
| `EVENT_COLORS` | `Object` | 顏色名稱到十六進位色碼的對照表（共 10 種）。 |

### Calendar

| 函式 | 簽章 | 說明 |
|---|---|---|
| `setDate(d)` | `(Date) → void` | 設定目前導覽日期。 |
| `getDate()` | `→ Date` | 回傳目前日期的副本。 |
| `setView(v)` | `('month'\|'week'\|'day'\|'agenda') → void` | 設定目前檢視模式。 |
| `getView()` | `→ string` | 回傳目前檢視模式名稱。 |
| `navigate(dir)` | `(1\|-1) → void` | 依目前檢視的時間單位前進或後退。 |
| `titleLabel()` | `→ string` | 回傳目前檢視與日期的標題文字。 |
| `render()` | `→ void` | 顯示目前檢視容器並呼叫對應的繪製函式。 |
| `on(eventType, fn)` | `(string, Function) → void` | 為 `'eventClick'` 或 `'dayClick'` 註冊回呼函式。 |
| `fmtTime(iso)` | `(string) → string` | 將 ISO 日期字串格式化為繁體中文時間（例如 `下午2:00`）。 |
| `sameDay(a, b)` | `(Date, Date) → boolean` | 若兩個日期的年月日相同則回傳 true。 |
| `isToday(d)` | `(Date) → boolean` | 若 `d` 是今天則回傳 true。 |
| `startOfDay(d)` | `(Date) → Date` | 回傳 `d` 當日的午夜時間。 |
| `endOfDay(d)` | `(Date) → Date` | 回傳 `d` 當日的 23:59:59.999。 |

### Recurrence

| 函式 | 簽章 | 說明 |
|---|---|---|
| `expand(event, rangeStart, rangeEnd)` | `(Event, Date, Date) → Event[]` | 將範圍內的重複事件展開為個別事件物件。每個事件都有組合式 `id`、`_masterId`、`_isOccurrence: true` 及調整後的 `start`／`end`；若範圍內沒有事件則回傳 `[]`。 |
| `parseRRule(rrule)` | `(string) → Object\|null` | 將以分號分隔的 RRULE 字串解析為鍵值物件。 |

### ICS

| 函式 | 簽章 | 說明 |
|---|---|---|
| `exportICS(events)` | `(Event[]) → string` | 將事件序列化為有效的 iCalendar 字串（RFC 5545），每行依規格折行。 |
| `importICS(text)` | `(string) → Event[]` | 解析 iCalendar 字串並回傳事件物件陣列；支援取消折行、`VALARM` 區塊及 `VALUE=DATE` 全天事件。 |

---

## 12. 資料結構

### 事件物件

```js
{
  id:          string,          // 'evt-<timestamp>-<random>' 或 'import-...'
  title:       string,
  description: string,          // Markdown 本文
  start:       string,          // ISO 8601，例如 '2026-04-20T14:00:00'
  end:         string,          // ISO 8601
  allDay:      boolean,
  timezone:    string,          // IANA 時區，例如 'Asia/Colombo'
  location:    string,
  color:       string,          // EVENT_COLORS 中的顏色名稱
  label:       string,          // 自由輸入的標籤
  recurrence:  string,          // RRULE 字串或 ''
  reminders:   number[],        // 開始前的分鐘數
  attendees:   string[],        // 電子郵件地址
  attachments: string[],        // 網址
  created:     string,          // ISO 8601 時間戳記
  modified:    string,          // ISO 8601 時間戳記
}
```

### 重複事件（虛擬事件）

欄位與 Event 相同，並額外包含：

```js
{
  _masterId:     string,   // 主重複事件的 ID
  _isOccurrence: true,
  id:            string,   // '<masterId>_YYYY-MM-DD'
  start:         string,   // 此次事件調整後的開始時間
  end:           string,   // 此次事件調整後的結束時間
}
```

### 設定記錄（IndexedDB）

```js
{ key: string, value: any }
```

目前使用的鍵：`'theme'`（`'light'` | `'dark'`）、`'seeded'`（`boolean`）。

---

## 13. 貢獻方式

Payas Days 以 MIT 授權條款開放原始碼，歡迎貢獻。

### 如何貢獻

1. **Fork** 此儲存庫。
2. 直接編輯專案中的檔案，不需要建置步驟。
3. 使用 **Chromium**、**Firefox** 及**行動裝置尺寸**進行測試。
4. 測試**淺色與深色模式**。
5. 提交 **pull request**，清楚說明變更內容與原因。

### 程式碼規範

- **不使用框架** — 僅使用原生 JavaScript（ES2022）。
- **模組模式** — 每個檔案以單一回傳物件公開功能；不使用 ES `import`／`export`。
- **設計變數** — 色彩與陰影一律使用 `var(--token-name)`，新增 CSS 規則時不要寫死色碼。
- **深色模式** — 所有視覺變更都必須同時適用兩種主題，並使用主題按鈕測試。
- **行動裝置優先** — 以 375 px 寬度測試，確保版面易於閱讀與點按。
- **避免無效註解** — 僅為不易理解的邏輯加註解（例如 RRULE 展開邊界情況、IndexedDB 交易模式）。

### 後續改進方向

以下功能可列入未來版本規劃：

- [ ] **拖放調整時間** — 在週／日檢視中拖曳事件以變更時間
- [ ] **跨日事件列** — 月檢視中的全天事件可跨日期格顯示
- [ ] **時區顯示** — 比較事件儲存時區與本機時區的時間
- [ ] **Google 日曆同步** — 整合雙向 CalDAV 或 Google Calendar API
- [ ] **PWA／離線支援** — 加入 Service Worker 與 Web App Manifest，支援安裝
- [ ] **重複事件編輯範圍** — 編輯時可選「此事件／此事件及後續／所有事件」
- [ ] **無障礙支援** — 事件標籤鍵盤導覽，以及檢視切換的 ARIA live region
- [ ] **含日期篩選的事件搜尋** — 依日期範圍或標籤篩選結果

## 14. 授權條款

本專案採用 MIT License。正式授權文字請參閱 [LICENSE](LICENSE)；為維持法律文本的一致性，授權原文保留英文。

---

### MIT License 原文

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

*Payas Days — 由 Saman Wijesinghe 用心打造*
