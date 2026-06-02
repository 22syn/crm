# Stitch DemoCRM — מחקר UX ורעיונות לשיפור

**מקור:** Stitch Project 12969395350507001707 + hadaryaCRM נוכחי  
**תאריך:** 2026-03-03

---

## 1. סיכום Stitch DemoCRM (מבנה ו-UX)

לפי המפרט מ-Stitch והתיעוד:

| מודול Stitch | תיאור | רכיבי UX מרכזיים |
|--------------|--------|------------------|
| **Main Dashboard** | High-level data visualizations and performance KPIs | KPI cards, charts, activity feed |
| **Lead Management (Kanban)** | Visual deal-tracking board | עמודות לפי stage, כרטיסים, drag-and-drop |
| **Lead Management (Table)** | Detailed, searchable database of potential deals | טבלה עם חיפוש, מיון, פילטרים |
| **Lead Details Profile** | Deep-dive interaction history for individual leads | פרופיל ליד, היסטוריית אינטראקציות, timeline |
| **Task Calendar** | Scheduling interface for sales appointments | לוח שנה, אירועים |
| **Sales Analytics** | Reporting and performance monitoring | דוחות, מטריקות למנהלים |
| **Settings & Team Management** | User and permission controls | משתמשים, הרשאות |
| **Contacts & Clients Directory** | Long-term customer relationship management | תיקיית לקוחות/אנשי קשר |
| **Notification Center** | Centralized inbox for alerts and team communication | תיבת דוא"ל/התראות |

---

## 2. מבנה נוכחי ב-hadaryaCRM — ניתוח

### 2.1 Kanban

| אלמנט | מצב נוכחי | הערות |
|-------|-----------|-------|
| **עמודות** | `EntityKanbanColumn` — 220px/280px min, קבוע | אין collapse, אין resize |
| **כרטיסים** | `LeadCard`, `DealCard` — תוכן מלא | אפשר להוסיף קומפקט mode |
| **גרירה** | @dnd-kit, `DragOverlay` | עובד |
| **מיון בתוך עמודה** | `sortItems` — לפי תאריך/שם | יש |
| **מיון כללי** | Sort dropdown מעל Kanban | יש |
| **עמודות נסתרות** | `selectedColumns` — רק ב-Leads? | לא ממומש במלואו |
| **נפח כרטיס** | אחיד | Stitch לעתים משתמש ב־card density (compact/detailed) |
| **Empty column** | "No leads" / "No items" | יש |
| **Column header** | שם + badge מספר + נקודת צבע | יש |

**פערים:**
- אין **swimlanes** (למשל לפי assignee)
- אין **column collapse** — להסתיר עמודות לא רלוונטיות
- אין **compact/expanded toggle** לכרטיסים
- **Column width** קבוע — אין resize לפי תוכן

---

### 2.2 Table

| אלמנט | מצב נוכחי | הערות |
|-------|-----------|-------|
| **עמודות** | `DataTable` — גמיש, minWidth | טוב |
| **מיון** | Sort dropdown ו-header sort | יש |
| **בחירה** | Checkbox, bulk actions | יש ב-Leads |
| **Inline edit** | `customer_name`, `customer_phone`, `customer_email` | יש |
| **פעולות שורה** | Edit, View Quote, Create Quote | יש |
| **Sticky header** | לא | בנתונים רבים — header נעלם |
| **Pagination** | Leads: pagination (PAGE_SIZE 50) | יש |
| **Column visibility** | רק Ad Agency | Leads/Deals/Contracts — אין |
| **Row density** | קבוע | אין compact/comfortable |
| **חיפוש** | ב-toolbar (LeadFilters) | יש |
| **Empty state** | "No data found" | גנרי — לא מותאם לדף |

**פערים:**
- אין **sticky header** בטבלאות ארוכות
- אין **column visibility** ב-Leads, Deals, Contracts
- אין **row density** (compact/comfortable/relaxed)
- **Empty state** בטבלה גנרי — כדאי empty state ייעודי לכל ישות

---

### 2.3 Lead Detail

| אלמנט | מצב נוכחי | הערות |
|-------|-----------|-------|
| **Header** | שם, תאריך, כפתור Edit | יש |
| **מידע בסיסי** | כרטיסים (סטטוס, מקור, assignee, ציטוט) | יש |
| **היסטוריית אינטראקציות** | `LeadComments` | הערות בלבד |
| **Timeline** | אין | Stitch: "interaction history" — לרוב timeline |
| **פעולות מהירות** | Edit, Create Quote, View Quote | יש |
| **Breadcrumb** | "Back to leads" | יש |

**פערים:**
- אין **timeline** של אירועים (שיחה, פגישה, הערה, שינוי סטטוס)
- `LeadComments` — לא מוצג כ־timeline chronologic
- אין **next steps** או פעולות מומלצות

---

### 2.4 Toolbar & Filters

| אלמנט | מצב נוכחי | הערות |
|-------|-----------|-------|
| **פילטרים** | Status, Source, Assignee, Search | יש |
| **Saved views** | שמירת תצוגות, Quick views | יש |
| **מיון** | Sort dropdown | יש |
| **Column visibility** | Ad Agency בלבד | חסר ב-CRM core |
| **Mobile** | Sheet עם פילטרים | יש |
| **Clear filters** | כפתור | יש |

**פערים:**
- **Filter chips** — לא מוצגים בצורה ויזואלית (סטטוס X, מקור Y)
- אין **filter presets** מוגדרים מראש (למשל "לידים חמים", "לידים ללא פגישה")

---

### 2.5 Empty States

| מקום | מצב נוכחי | הערות |
|------|-----------|-------|
| **Leads (no filters)** | "Add your first lead" + Add demo | `LeadsEmptyState` — טוב |
| **Leads (filters active)** | "No leads match" + Clear/Reset | טוב |
| **Table empty** | "No data found" | גנרי |
| **Kanban column** | "No leads" / "No items" | מינימלי |
| **Dashboard charts** | "No deals yet", "No revenue data" | יש |

**פערים:**
- **Deals, Contracts** — empty state ייעודי?
- **Kanban column** — אפשר CTA קל ("הוסף ליד ל־New")
- **Loading skeletons** — Kanban יש, Table לא תמיד

---

## 3. רעיונות לשיפור (לפי עדיפות)

### P1 — השפעה גבוהה, מורכבות בינונית

#### 3.1 Table: Sticky Header
- **מה:** header של הטבלה נשאר קבוע בגלילה
- **למה:** טבלאות ארוכות — שמירת הקשר
- **איפה:** `DataTable.tsx` — `position: sticky` על `TableHeader`

#### 3.2 Table: Column Visibility (Leads, Deals, Contracts)
- **מה:** dropdown להצגה/הסתרה של עמודות
- **למה:** התאמה אישית ל־power users
- **איפה:** `EntityToolbar` — `renderColumnVisibility`, `LeadTable`, `DealTable`, `QuoteTable`

#### 3.3 Lead Detail: Timeline / Interaction History
- **מה:** ציר זמן של אירועים — הערות, שינוי סטטוס, יצירת ציטוט
- **למה:** Stitch: "deep-dive interaction history"
- **איפה:** `LeadDetail.tsx` — רכיב `LeadTimeline` חדש
- **נתונים:** `lead_comments`, אפשר להוסיף `lead_activities` או להשתמש ב-audit

#### 3.4 Kanban: Column Collapse
- **מה:** הסתרת עמודות לא רלוונטיות (למשל Lost, Won)
- **למה:** התמקדות בשלבים פעילים
- **איפה:** `EntityKanban` — `selectedColumns` כבר קיים ב-Leads, צריך UI לבחירה

### P2 — השפעה בינונית

#### 3.5 Filter Chips
- **מה:** תגיות לפילטרים פעילים (סטטוס, מקור, assignee)
- **למה:** שקיפות — רואים מייד מה מסונן
- **איפה:** `EntityToolbar` או `LeadFilters` — הצגה של filters פעילים כ-chips נטענים

#### 3.6 Table: Row Density
- **מה:** מצבים: compact / comfortable / relaxed
- **למה:** התאמה להעדפת משתמש
- **איפה:** `DataTable` — padding/margin לפי density

#### 3.7 Kanban: Compact Card Mode
- **מה:** מצב כרטיס מקוצר (שורה אחת) vs מפורט
- **למה:** צפיפות נתונים — יותר כרטיסים במסך
- **איפה:** `LeadCard`, `DealCard` — prop `compact`

#### 3.8 Empty State ייעודי ל-Deals, Contracts
- **מה:** כמו `LeadsEmptyState` — "Add your first deal" וכדומה
- **למה:** עקביות ו-CFA ברור
- **איפה:** `Deals.tsx`, `Quotes.tsx` — `DealsEmptyState`, `ContractsEmptyState`

### P3 — שיפורים נוספים

#### 3.9 Kanban: Swimlanes (לפי Assignee)
- **מה:** שורות משנה בתוך כל עמודה — "שלי", "לא משויך"
- **למה:** Stitch ו-CRM — התמקדות ב-"My pipeline"
- **איפה:** `EntityKanban` — מבנה חדש, מורכב יותר

#### 3.10 Lead Detail: Next Steps
- **מה:** בלוק "הצעד הבא" — למשל "לתאם פגישה", "לשלוח ציטוט"
- **למה:** הנחיית המשתמש
- **איפה:** `LeadDetail.tsx`

#### 3.11 Table: Resizable Columns
- **מה:** גרירת גבול עמודה לשינוי רוחב
- **למה:** התאמה אישית
- **איפה:** `DataTable` — רזייזר על headers

#### 3.12 Loading: Table Skeleton
- **מה:** skeleton rows במקום ספינר
- **למה:** תחושת מהירות, פרוגרסיבי
- **איפה:** `DataTable` או `LeadTable` — `isLoading` + Skeleton

---

## 4. מיפוי Stitch → hadaryaCRM (מבנה)

| Stitch | hadaryaCRM | פער UX |
|--------|------------|--------|
| Lead Kanban | EntityKanban + LeadKanban | column collapse, compact cards |
| Lead Table | LeadTable + DataTable | column visibility, sticky header |
| Lead Detail | LeadDetail | timeline, next steps |
| Deals | DealKanban, DealTable | כמו Leads |
| Contracts | QuoteKanban, QuoteTable | כמו Leads |
| Dashboard | Dashboard | KPIs, charts — כבר מעוצב |
| Customers | Customers | טבלה — column visibility |
| Settings | Settings | אין פער משמעותי |

---

## 5. המלצה לביצוע

**שלב 1 (מהיר):**
1. Table: Sticky header  
2. Column visibility ל-Leads (ולאחר מכן Deals, Contracts)  
3. Empty states ל-Deals, Contracts  

**שלב 2 (בינוני):**
4. Lead Detail: Timeline / interaction history  
5. Kanban: Column collapse (UI לבחירת עמודות)  
6. Filter chips  

**שלב 3 (אופציונלי):**
7. Row density, Compact cards, Swimlanes  

---

**הערה:** לא ניתן היה לנווט בפועל בין מסכי Stitch (MCP Browser ב־Ask mode). המחקר מבוסס על:
- תיאורי המודולים מ-Stitch  
- המבנה הנוכחי של hadaryaCRM  
- Best practices של CRM (Stitch guide, UXPin)

לשיפור עומק — מומלץ לפתוח את הפרויקט ב-Stitch במצב Agent ולבצע צילומי מסך של כל מסך.
