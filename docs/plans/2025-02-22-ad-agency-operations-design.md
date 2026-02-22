# משרד פרסום — עיצוב מודול אופרציה

**תאריך:** 22 בפברואר 2025  
**סטטוס:** מאושר  
**הקשר:** הוספת מודול ניהול אופרציה של משרד פרסום ל־Demo CRM.

---

## 1. מה בונים

מודול **משרד פרסום** לניהול לקוחות, פרויקטים, פריטים (קטלוג עם סוג ומחיר), תקציבים (נדרש vs אושר), ומשימות מתקדמות (אחראי, תאריכים, תת־משימות).

- **Single-tenant:** חברת פרסום אחת בלבד
- **לקוחות נפרדים:** לא קשור ל־Customers / Leads הקיימים
- **גישה:** כל משתמשי CRM (has_crm_access)

---

## 2. מודל נתונים

### טבלאות

| טבלה | תיאור |
|------|--------|
| `op_clients` | לקוחות: שם חברה, אימייל, טלפון, שם איש קשר, טלפון איש קשר, כתובת, הערות |
| `op_items` | קטלוג פריטים: `type` (סוג), `price` (מחיר) – CRUD |
| `op_projects` | פרויקטים: `client_id`, `budget_required`, `budget_approved`, סטטוס, תאריכים |
| `op_project_items` | פריטי פרויקט: `project_id`, `item_id`, `quantity` – סך = item.price × quantity |
| `op_project_tasks` | משימות: כותרת, סטטוס, `assigned_to`, תאריכי התחלה/סיום, הערות |
| `op_task_subtasks` | תת־משימות: `task_id`, כותרת, סטטוס |

### קשרים

- `op_clients` → `op_projects` (1:N)
- `op_projects` → `op_project_items` (1:N)
- `op_projects` → `op_project_tasks` (1:N)
- `op_project_tasks` → `op_task_subtasks` (1:N)
- `op_project_items` → `op_items` (N:1)

### RLS

`has_crm_access(auth.uid())` על כל טבלאות `op_*`.

---

## 3. תצוגות ומסכים

### ניווט (Sidebar)

קבוצה **"משרד פרסום"**:

| כותרת | נתיב |
|-------|------|
| דשבורד | `/ad-agency` |
| לקוחות | `/ad-agency/clients` |
| פרויקטים | `/ad-agency/projects` |
| פריטים | `/ad-agency/items` |

### מסכים

| נתיב | תוכן |
|------|------|
| `/ad-agency` | דשבורד: סיכום תקציבים, פרויקטים פעילים, משימות קריטיות |
| `/ad-agency/clients` | רשימת לקוחות + הוספה/עריכה |
| `/ad-agency/clients/:id` | דף לקוח: פרטים + רשימת פרויקטים |
| `/ad-agency/projects` | רשימת פרויקטים + Kanban לפי סטטוס |
| `/ad-agency/projects/:id` | דף פרויקט: תקציב, פריטים, משימות |
| `/ad-agency/items` | טבלת פריטים (סוג + מחיר) – CRUD |

---

## 4. ארכיטקטורה

### מבנה קבצים

```
src/
├── pages/
│   └── ad-agency/
│       ├── AdAgencyDashboard.tsx
│       ├── AdAgencyClients.tsx
│       ├── AdAgencyClientDetail.tsx
│       ├── AdAgencyProjects.tsx
│       ├── AdAgencyProjectDetail.tsx
│       └── AdAgencyItems.tsx
├── components/
│   └── ad-agency/
│       ├── ClientDialog.tsx
│       ├── ClientTable.tsx
│       ├── ProjectTable.tsx
│       ├── ProjectKanban.tsx
│       ├── ProjectDetailTabs.tsx
│       ├── ProjectItemRow.tsx
│       ├── ProjectTaskRow.tsx
│       ├── TaskSubtasks.tsx
│       └── ItemDialog.tsx
```

### Data flow

- Supabase ישירות מה־pages/hooks (כמו Leads, Deals)
- React Query לעדכונים ותצוגה
- שימוש חוזר ב־DataTable, EntityKanban, EntityPageShell, profiles

---

## 5. החלטות מרכזיות

| החלטה | סיבה |
|-------|------|
| Single-tenant | פישוט, ללא agency entity |
| לקוחות נפרדים | הפרדה מ־Leads/Customers |
| פריטים כקטלוג (סוג + מחיר) | תשתית להצעת מחיר אוטומטית מאוחר יותר |
| תקציב ברמת פרויקט + פריט | התאמה לתהליך עבודה קיים |
| משימות מתקדמות | אחראי, תאריכים, תת־משימות |
| נתיבים `/ad-agency/*` | מבנה ברור תחת משרד פרסום |

---

## 6. צעדים הבאים

→ Invoke **writing-plans** skill לקבלת תוכנית מימוש מפורטת.
