# Ad Agency Column Visibility — Design

**תאריך:** 2025-02-23

## מטרה

לאפשר לכל יוזר לערוך אילו עמודות מוצגות בטבלאות משרד הפרסום (לקוחות, פרויקטים, פריטים, משימות), ולשמור את ההעדפה באופן פרטי לכל משתמש.

## החלטות עיצוב

- **פשוט ונפרד:** העדפת עמודות נפרדת מפילטרים, בלי views מרובים
- **UI:** dropdown בטנובר או ליד הטבלה — checkbox לכל עמודה + "איפוס לברירת מחדל"
- **איפוס:** תמיד אפשרות לאפס לברירת מחדל

## ארכיטקטורה

**Migration:**
- הוספת עמודה `column_visibility jsonb` לטבלה `user_table_preferences` (ברירת מחדל: null)
- `null` = הצגת כל העמודות; כשמשתמש משנה נשמר `["id1", "id2", ...]`
- ה-unique index נשאר `(user_id, page_key, view_name)` — עובדים על view `'default'`

**Hook חדש:** `useColumnVisibility(pageKey: string)`
- טוען `column_visibility` עבור page_key ו-view_name='default'
- מחזיר: `{ visibleColumnIds: string[] | null, setVisibleColumns, resetToDefault }`
- `null` = אין שמירה → הצגת כל העמודות
- `setVisibleColumns` — upsert
- `resetToDefault` — עדכון ל-null

**Page keys:** `ad-agency-clients`, `ad-agency-projects`, `ad-agency-items`, `ad-agency-tasks`

## קומפוננטות

**ColumnVisibilityDropdown:**
- Props: `allColumns`, `visibleIds`, `onChange`, `onReset`
- כפתור/אייקון שמפתח dropdown עם checkbox לכל עמודה + "איפוס לברירת מחדל"

**שילוב בטבלאות:**
- ClientTable, ProjectTable, ItemTable, TaskTable — props: `columnVisibility`
- מסננים columns לפי `visibleIds`; null = כל העמודות

## Data Flow

- **טעינה:** useColumnVisibility → query → visibleColumnIds
- **שינוי:** onChange → setVisibleColumns → upsert → invalidation
- **איפוס:** onReset → column_visibility: null
- **Fallback:** visibleIds מפנה ל־ids שלא קיימים → הצגת כל העמודות

## Error Handling

- כישלון טעינה → fallback ל־null (כל העמודות)
- כישלון שמירה → toast + state נשאר
- משתמש לא מחובר → null, שינויים לא נשמרים
