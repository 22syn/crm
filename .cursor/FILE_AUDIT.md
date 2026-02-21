# סקירת קבצים – קבצים לא רלוונטיים / לניקוי

תאריך: פברואר 2025  
פרויקט: demoCRM (React + Vite + Supabase)

---

## 1. קבצים שלא בשימוש – הוסרו ✓

| קובץ | סיבה | סטטוס |
|------|------|--------|
| ~~`src/pages/Index.tsx`~~ | הדף לא משויך ב־`App.tsx`. הנתיב `/` מנווט ל־`/dashboard` עם `<Navigate>`. | **נמחק** |
| ~~`src/App.css`~~ | לא מיובא בשום מקום. `main.tsx` טוען רק `index.css`. | **נמחק** |
| ~~`src/components/NavLink.tsx`~~ | קומפוננטה שלא מיובאת באף קובץ. | **נמחק** |
| ~~`src/components/leads/KanbanColumn.tsx`~~ | מוחלף על ידי EntityKanban + EntityKanbanColumn. LeadKanban משתמש ב־EntityKanban. | **נמחק** |
| ~~`src/components/deals/DealColumn.tsx`~~ | מוחלף על ידי EntityKanban. DealKanban משתמש ב־EntityKanban. | **נמחק** |
| ~~`src/components/quotes/QuoteColumn.tsx`~~ | מוחלף על ידי EntityKanban. QuoteKanban משתמש ב־EntityKanban. | **נמחק** |
| ~~`src/components/designs/DesignRequestColumn.tsx`~~ | מוחלף על ידי EntityKanban. DesignRequestKanban משתמש ב־EntityKanban. | **נמחק** |
| ~~`src/components/quotes/QuoteCard.tsx`~~ | לא מיובא באף מקום. Quotes משתמש ב־QuoteKanbanCard + QuoteTable. | **נמחק** |

---

## 2. כפילות / אופציונלי

| פריט | הערה |
|------|------|
| **`src/hooks/use-toast.ts`** vs **`src/components/ui/use-toast.ts`** | **נשאר כפי שהוא:** המקור ב־`@/hooks/use-toast`; הקובץ ב־`components/ui` מייצא מחדש (קונבנציית shadcn). כל הייבואים כבר מ־`@/hooks/use-toast`. ה־re-export נשמר לתאימות. |

---

## 3. תיקיות וקבצים שכדאי לבדוק (לא בהכרח למחוק)

| פריט | הערה |
|------|------|
| **`maestro/`** | **לא למחוק** (בקשת משתמש). 15 קבצים: תכניות, מדריכים, `maestro.config.json`. להשאיר כפי שהם. |
| **`dist/`** | תוצאת build. מופיע ב־`.gitignore`. **נבדק:** לא ב־git (אין קבצים ב־tracking). ✓ |
| **`.cursor/PLUGINS_REVIEW.md`** | תיעוד פלאגינים של Cursor – רלוונטי לפיתוח. להשאיר. |
| **`scripts/open-fix-pr.sh`** | סקריפט לפתיחת PR לתיקון טיקט – שימושי. להשאיר. |

---

## 4. תלויות – אופציונלי

| חבילה | הערה |
|--------|------|
| ~~**`tagger`**~~ (devDependencies) | **הוסר:** החבילה וה־plugin הוסרו מ־`vite.config.ts` ו־`package.json`. |

---

## 5. סיכום פעולות

1. **בוצע:** נמחקו `Index.tsx`, `App.css`, `NavLink.tsx`.

2. **maestro/:** לא נמחק – נשמר לפי בקשת משתמש.

3. **בוצע:** אומת ש־`dist` לא ב־git. הוסר ה־tagger מ־package.json ו־vite.config.ts.

4. **toast:** נשאר במבנה הנוכחי (re-export ב־ui נשמר).

---

*נוצר אוטומטית מסקירת קוד.*
