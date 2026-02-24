# עיצוב הרשאות לפי מודולים

**תאריך:** 23 פברואר 2025  
**סטטוס:** אושר, מוכן ליישום  
**Implementation Plan:** `docs/plans/2025-02-23-modular-permissions-implementation.md`

---

## מטרה

הפרדת הרשאות לפי שלושת המודולים במערכת:
1. **לידים** – לידים, עסקאות, הצעות, לקוחות, מוצרים, עיצובים
2. **משרד פרסום** – לקוחות, פרויקטים, משימות, פריטים
3. **הגדרות מערכת** – Settings, ספקים, אוטומציות, ניהול הרשאות

כל מודול יהיה עם **admin** (רואה הכל + מחיקה) ו-**user** (גישה מוגבלת). בנוסף: **Super-Admin** שמנהל הכל.

---

## מודל נתונים

### 1. `profiles` – שדה חדש

```sql
super_admin BOOLEAN DEFAULT false
```

### 2. `user_module_roles` – טבלה חדשה

```sql
CREATE TABLE user_module_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,  -- 'leads' | 'ad_agency' | 'system'
  role TEXT NOT NULL,    -- 'admin' | 'user'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module)
);
```

### 3. `user_roles` – תימחק

מוחלף על ידי `user_module_roles` + `profiles.super_admin`.

---

## מיפוי מודולים

### מודול לידים
| נתונים | Admin | User |
|--------|-------|------|
| Dashboard, Leads, Deals, Contracts, Design Requests, Customers, Products | רואה הכל + מחיקה | רואה ועורך רק assigned_to שלו |

### מודול משרד פרסום
| נתונים | Admin | User |
|--------|-------|------|
| דשבורד, לקוחות, פרויקטים, משימות, פריטים, הצעות מחיר | רואה הכל + מחיקה | רואה ועורך (בלי מחיקה) |

### מודול הגדרות מערכת
| נתונים | Admin | User |
|--------|-------|------|
| Settings, Suppliers, Automations, ניהול הרשאות | גישה מלאה | אין גישה |

---

## RLS

### פונקציות עזר

- `has_module_access(user_id, module)` → יש שורה ב־user_module_roles
- `has_module_admin(user_id, module)` → role = 'admin'
- `is_super_admin(user_id)` → profiles.super_admin

### כללי גישה

- **Super-Admin:** גישה לכל דבר
- **לידים:** admin = כל הפעולות, user = רק assigned_to
- **משרד פרסום:** admin = +מחיקה, user = צפייה ועריכה
- **הגדרות:** רק admin (אין user)

---

## Frontend

### AuthContext

- `moduleRoles: { leads?, ad_agency?, system? }` – לכל מודול: 'admin' | 'user'
- `superAdmin: boolean`
- `canAccessModule(module)`, `isModuleAdmin(module)`

### Sidebar

- הצגת פריטים לפי `canAccessModule`
- הגדרות מערכת: רק superAdmin או system admin

---

## Migration

1. הוספת `profiles.super_admin`, יצירת `user_module_roles`
2. העברת נתונים מ־`user_roles`:
   - admin → super_admin או admin בכל המודולים
   - sales → user ב־leads ו־ad_agency
3. עדכון RLS
4. עדכון AuthContext + רכיבים
5. מחיקת `user_roles`
