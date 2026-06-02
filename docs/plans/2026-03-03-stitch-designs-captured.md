# Stitch DemoCRM — עיצובים שצולמו (Browser MCP)

**תאריך:** 2026-03-03  
**מקור:** https://stitch.withgoogle.com/projects/12969395350507001707  
**שיטה:** Browser MCP — ניווט לצילום מסך

---

## 1. מבט כללי

הפרויקט מציג **~11 עיצובים** בתצוגת thumbnails.  
הקבצים הקטנים (6% zoom) מקשים על פרטים, אבל אפשר לזהות מבנים עיקריים.

---

## 2. רשימת עיצובים (לפי תצוגת Stitch)

| # | כותרת (חלקית) | תיאור מה-thumbnail |
|---|----------------|-------------------|
| 1 | **Had...** / **Hadarya C...** | דשבורד — גרפים, bar charts, KPIs, רקע כהה |
| 2 | **Hadarya C...** (אחר) | layout עם sidebar סגול/כחול כהה משמאל, תוכן לבן |
| 3 | **Lead...** | רשימה/טבלה — מידע לידים |
| 4 | **Sale...** | דשבורד/אנליטיקס — גרפים ו-KPIs |
| 5 | **CRM Conta...** | **טבלה ברורה** — עמודות (Name, Email, Phone), שורות, כפתורי פעולה. רקע לבן |
| 6 | **CRM Notifi...** | רשימת התראות — פריטים עם אייקון, כותרת, timestamp. רקע לבן |
| 7 | **Add ...** | טפסים/modal להוספת רשומה. רקע לבן |
| 8 | **CRM...** | דפי פרטים או טפסים |
| 9–11 | נוספים | גרפים, דשבורד, פריסות נוספות |

---

## 3. מבנים מזוהים

### 3.1 דשבורד / אנליטיקס
- **רקע:** כהה (`#151938` / דומה)
- **רכיבים:** כרטיסי KPI, bar charts, line charts
- **הערה:** תואם ל־StatsCardsStitch, SalesPipelineChart, MonthlyRevenueChart

### 3.2 טבלת אנשי קשר (CRM Contacts)
- **מבנה:** טבלה קלאסית — עמודות, שורות
- **עמודות:** Name, Email, Phone + כנראה עוד
- **פעולות:** כפתורי פעולה בשורה
- **סגנון:** רקע לבן, טבלה ברורה
- **התאמה:** Customers, LeadTable, DealTable

### 3.3 התראות (CRM Notifications)
- **מבנה:** רשימה אנכית
- **פריט:** אייקון, כותרת, timestamp
- **רקע:** לבן

### 3.4 Layout ראשי (Hadarya C...)
- **Sidebar:** סגול/כחול כהה משמאל
- **תוכן:** אזור לבן מרכזי
- **הערה:** דומה ל־DashboardSidebar + תוכן ראשי

### 3.5 Kanban
- **בתצוגה:** לא זוהה Kanban ברור ב-thumbnails
- **מסקנה:** יתכן Kanban קיים אבל לא בולט בתצוגה הקטנה, או שאין Kanban בפרויקט Stitch

---

## 4. הנחיות לעבודה לפי העיצובים

### Dashboard
- כרטיסי KPI כהים — **כבר מיושם**
- גרפים עם accent `#1337ec` — **כבר מיושם**
- Activity feed — **כבר מיושם**

### טבלאות
- מבנה עמודות + שורות + כפתורי פעולה — תואם `DataTable`
- **להמשיך:** Sticky header, Column visibility (לפי `2026-03-03-stitch-ux-research-and-improvements.md`)

### Customers / Contacts
- טבלה כמו "CRM Contacts" — להדגיש מבנה טבלה ברור
- שדות: Name, Email, Phone, פעולות

### Lead Table
- אם יש עיצוב "Lead..." — ליישם דומה לטבלת Contacts
- Inline edit, מיון, פילטרים — **כבר קיימים**

### Notification Center
- רשימה עם אייקון + כותרת + timestamp
- **להערה:** אין כרגע דף Notifications — רק אם יחליטו להוסיף

---

## 5. מגבלות

- **Stitch ב-Canvas:** תוכן בתוך canvas/iframe — אין אלמנטים נפרדים ב-accessibility tree
- **קליק על thumbnails:** לא פתח עיצוב מלא (אולי דורש אינטראקציה אחרת)
- **Stitch MCP:** נכשל (gcloud auth / Xcode license)
- **Zoom 6%:** פרטים מוגבלים ב-thumbnails

---

## 6. המלצה

העיצובים המזוהים תואמים את המבנה הנוכחי של hadaryaCRM.  
מומלץ:

1. **Dashboard** — להשאיר במצב הנוכחי (Stitch-aligned)
2. **טבלאות** — להמשיך עם שיפורי UX (sticky header, column visibility)
3. **Customers** — לוודא מבנה טבלה כמו "CRM Contacts"
4. **Lead Detail** — Timeline לפי מסמך ה-UX research

לצילום מדויק יותר של כל מסך — מומלץ להפעיל Stitch MCP אחרי תיקון auth, או לנווט ידנית ב-Stitch ולפתוח כל עיצוב.
