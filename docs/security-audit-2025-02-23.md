# דו"ח אבטחה ובדיקה קצה־לקצה – hadaryaCRM

**תאריך:** 23 פברואר 2025  
**סטטוס:** ממצאים מהביקורת + המלצות

---

## סיכום מנהלים

| חומרה | כמות | דוגמאות |
|-------|------|---------|
| **קריטי** | 3 | טוקן Shopify ב-bundle, סיסמאות בסקריפטים, הזרקת ILIKE |
| **גבוה** | 3 | XSS ב-send-quote, NotFound ללא auth, חשיפת מבנה האפליקציה |
| **בינוני** | 5 | RLS לפי תפקיד, ולידציה ב-send-quote, rate limit ב-website-lead |
| **נמוך** | 4 | צמצום לוגים, אחסון recent leads ב-localStorage |

### מה עובד טוב
- Supabase auth עם `autoRefreshToken`, `persistSession`
- RLS על `leads`, `deals`, `quotes` – חוסם גישה ללא session
- `DashboardLayout` – redirect ל-/auth כשהמשתמש לא מאומת
- send-quote – בדיקת Bearer token ו-CRM role לפני שליחה

---

## ממצאים קריטיים (P0) – ✅ טופלו 2025-02-23

### 1. טוקן Shopify קשיח בקוד – ✅ טופל
**קובץ:** `src/lib/shopify.ts`
**בוצע:** העברה ל-`VITE_SHOPIFY_STOREFRONT_TOKEN` ב-.env. **המלצה:** החלף טוקן ב-Shopify כי נחשף ב-git history.

### 2. סיסמאות בסקריפטים – ✅ טופל
**קבצים:** `scripts/fix-admin-password.js` (ADMIN_PASSWORD), `scripts/run-seed-migration.js` (ADMIN_PASSWORD), `scripts/fix-password.sql` (placeholder).
**בוצע:** שימוש ב-env vars בלבד; סיסמאות לא מופיעות בקוד.

### 3. הזרקת ILIKE בחיפוש – ✅ טופל
**קבצים:** `Leads.tsx`, `GlobalCommandPalette.tsx`, `Customers.tsx`
**בוצע:** הוספת `src/lib/escapeIlike.ts` ו-`escapeIlike()` בכל השאילתות.

---

## ממצאים גבוהים (P1)

### 4. RLS – sales רואה את כל הלידים
**בעיה:** `has_crm_access` מאפשר גישה לכולם. אין הגבלה ל-`assigned_to` ל-sales.
**פעולה:** הוסף policies לפי תפקיד:
```sql
-- Sales רואה רק leads משויכים אליו
CREATE POLICY "Sales view own leads" ON public.leads FOR SELECT
USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'sales') AND assigned_to = auth.uid()));
```

### 5. XSS בתבנית האימייל (send-quote)
**קובץ:** `supabase/functions/send-quote/index.ts` – `item.title`, `customerName` וכו' מוכנסים ל-HTML בלי escape.
**פעולה:** הוסף `escapeHtml()` לכל ערך שמגיע מהמשתמש לפני השימוש ב-HTML.

### 6. NotFound ללא הגנת auth
**קובץ:** `src/pages/NotFound.tsx` – עמוד 404 לא עוטף ב־`DashboardLayout`, נגיש בלי התחברות.
**פעולה:** לעטוף ב־`DashboardLayout` או להפנות למשתמשים לא מאומתים ל־`/auth`.

---

## ממצאים בינוניים (P2)

- ולידציה של `send-quote` (מבנה, אורכים, טווחים)
- Rate limiting ל־`website-lead` (הגנה מפני spam)
- סקירת הרשאות QuoteApproval
- מרכוז הגנת routes ב־`ProtectedRoute` אחד

---

## בדיקה קצה־לקצה שבוצעה

### אימות ידני
1. **ניווט ל־/auth** – עמוד נטען (Demo CRM)
2. **ניווט ל־/dashboard ללא התחברות** – redirect ל־/auth
3. **GlobalCommandPalette** – לא נטען ב־/auth (שינוי שבוצע)

### E2E אוטומטי – לא קיים
- אין Playwright/Cypress בפרויקט
- **המלצה:** התקן Playwright ויצור smoke tests:
  ```bash
  npm init playwright@latest
  ```
  תרחישים מומלצים:
  - התחברות → redirect ל־dashboard
  - גישה ל־/dashboard בלי auth → redirect ל־/auth
  - יצירת ליד ושמירה
  - חיפוש לידים ופתיחת command palette

---

## תרשים זרימת Auth

```
משתמש לא מאומת → כל route מוגן → DashboardLayout → !session → redirect ל-/auth
משתמש מאומת ללא role → "Access Pending"
משתמש מאומת עם role → גישה מלאה
```

---

## צ'קליסט אבטחה

| דרישה | סטטוס |
|-------|--------|
| ולידציה/סניטציה של קלט | חלקי (ILIKE) |
| ללא סודות בקוד | ❌ (Shopify, scripts) |
| Auth על endpoints מוגנים | ✓ |
| SQL parameterized / שימוש בטוח | חלקי (ILIKE) |
| הגנה מפני XSS | חלקי (send-quote) |
| HTTPS | באחריות ה-hosting |
| CSRF | Supabase מטפל |
| Security headers | באחריות ה-hosting |
| הודעות שגיאה בטוחות | ✓ |
