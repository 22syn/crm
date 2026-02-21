# Demo CRM — Production Company Theme Design

**תאריך:** 21 בפברואר 2025  
**סטטוס:** מאושר  
**הקשר:** Demo CRM עוברת מורשה חברת ריהוט לחברת הפקות (פרסומות טלוויזיה, תצוגות אופנה).

---

## 1. רקע והחלטה

### שינוי כיוון
- **קודם:** Beige/Taupe — ריהוט, warm, קטלוג יוקרתי
- **עכשיו:** חברת הפקות — פרסומות טלוויזיה, תצוגות אופנה, יצירתי, מודרני

### גישה שנבחרה
**Clean Creative** — רקע בהיר, מינימלי, accent חזק (סגול-מג'נטה). מתאים לעבודה ממושכת, הצגה ללקוחות, ותחושת סוכנות/סטודיו.

---

## 2. פלטת צבעים

### Light Mode (ברירת מחדל)

| משתנה | ערך | תיאור |
|-------|-----|--------|
| `--background` | 220 15% 98% | רקע אפור-לבן קריר |
| `--foreground` | 220 20% 15% | טקסט כהה |
| `--card` | 220 15% 99% | כרטיסים |
| `--card-foreground` | 220 20% 15% | טקסט בכרטיסים |
| `--primary` | 220 20% 25% | ראשי, ניווט |
| `--primary-foreground` | 220 15% 98% | על primary |
| `--secondary` | 220 20% 95% | משני |
| `--muted` | 220 15% 93% | דהוי |
| `--muted-foreground` | 220 15% 45% | טקסט משני |
| `--accent` | 220 20% 90% | הדגשה כללית |
| `--accent-action` | 262 55% 50% | כפתורי פעולה (סגול-מג'נטה) |
| `--accent-action-foreground` | 0 0% 100% | לבן על accent |
| `--border` | 220 15% 90% | גבולות |
| `--ring` | 220 20% 35% | focus ring |
| `--sidebar-background` | 220 15% 18% | סיידבר כהה קריר |
| `--sidebar-foreground` | 220 15% 92% | טקסט סיידבר |
| `--sidebar-accent` | 220 12% 25% | hover/active בסיידבר |

### Dark Mode

| משתנה | ערך |
|-------|-----|
| `--background` | 220 15% 10% |
| `--foreground` | 220 15% 92% |
| `--card` | 220 15% 14% |
| `--primary` | 220 15% 90% |
| `--accent-action` | 262 55% 60% |
| `--sidebar-*` | גוונים כההים קרירים |

### Semantic (בלי שינוי)
- `--success`, `--warning`, `--destructive` — נשארים כמו היום

---

## 3. טיפוגרפיה

- **Display:** DM Serif Display — נשאר
- **Body:** Heebo — נשאר (RTL)
- **Scale:** ללא שינוי

---

## 4. רקעים ואנימציות

### Body background
```css
background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(220 15% 94%) 100%);
```

### Auth page
- גרדיאנט עדין, shadow על הכרטיס

### אנימציות
- StatsCards: staggered card-enter
- Dashboard: card-enter עם delay
- LeadCard, DealCard: shadow-sm → shadow-md ב-hover

### Empty states
- אייקונים (Plus, FilterX)
- היררכיה ויזואלית
- כפתורים עם variant="accent"

### Sidebar
- גוון כהה קריר (220°)
- Active state משופר
- ריווח בין קבוצות

---

## 5. קבצים לעריכה

| קובץ | שינויים |
|------|---------|
| `src/index.css` | פלטת צבעים מלאה — :root ו-.dark |
| `src/components/dashboard/StatsCards.tsx` | אנימציה (אם חסר) |
| `src/components/layout/DashboardSidebar.tsx` | ריווח, active state |
| `src/pages/Auth.tsx` | רקע (אם חסר) |
| `src/components/leads/LeadsEmptyState.tsx` | אייקונים (אם חסר) |

---

## 6. עקרונות מנחים

- **Contrast:** 4.5:1 מינימלי
- **RTL:** Heebo + תמיכה קיימת
- **Reduced motion:** `prefers-reduced-motion` נשמר
- **עקביות:** כל CTA ראשי ב-accent-action
