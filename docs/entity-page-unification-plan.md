# תוכנית איחוד עמודי Entity — Leads, Quotes, Deals, Designs

**מטרה:** מקסימום קוד משותף בין 4 העמודים. רק כותרת, subtitle, טקסט כפתור הוספה ותוכן הכרטיס/טופס משתנים.

---

## 1. המבנה המשותף (כיום)

כל העמודים משתמשים באותו pattern:

```
┌─────────────────────────────────────────────────────────┐
│ [Title]                                    [Add Button] │
│ [Subtitle]                                               │
├─────────────────────────────────────────────────────────┤
│ [Pipeline] [Table]  [Filters / Tabs (optional)]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Pipeline: Kanban עם עמודות לפי status                  │
│  או Table: טבלה עם מיון ופילטרים                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**מה משתנה:**

| רכיב | Leads | Quotes | Deals | Designs |
|------|-------|--------|-------|---------|
| Title | Leads | Quotes | Deals | Custom Designs |
| Subtitle | ... | Manage and create... | Sales pipeline... | Manage custom... |
| Add Button | New Lead | New Quote | New Deal | (אין) |
| Kanban | LeadKanban | QuoteKanban | DealKanban | DesignRequestKanban |
| Table | LeadTable | QuoteTable | DealTable | DesignRequestTable |
| Dialog | LeadDialog | QuoteBuilder+Preview | DealDialog | Upload Dialog |
| Filters | LeadFilters, saved views | Tabs (All/Draft...) | DealFilters, saved views | Tabs (Pending...) |

---

## 2. ארכיטקטורה מוצעת

### קומפוננטת `EntityPageShell`

מיקום: `src/components/entity-page/EntityPageShell.tsx`

**Props:**

```ts
interface EntityPageShellProps {
  // טקסטים
  title: string;
  subtitle: string;
  addButtonText?: string;        // אם לא מוגדר — לא מציג כפתור
  onAddClick?: () => void;

  // מצב תצוגה
  viewMode: "kanban" | "table";
  onViewModeChange: (mode: "kanban" | "table") => void;

  // תוכן
  renderKanban: React.ReactNode;
  renderTable: React.ReactNode;

  // אופציונלי — פילטרים/טאבים מעל התוכן
  renderToolbar?: React.ReactNode;

  // loading + empty
  isLoading?: boolean;
  isEmpty?: boolean;
  renderEmptyState?: React.ReactNode;

  // Report tab (רק Deals כרגע)
  showReportTab?: boolean;
  renderReport?: React.ReactNode;
}
```

**מבנה ה-JSX:**

```tsx
<DashboardLayout>
  <div className="space-y-section" dir="rtl">
    {/* Header */}
    <div className="flex flex-row-reverse items-center justify-between">
      <div className="text-left">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-body text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {addButtonText && onAddClick && (
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 ml-2" />
          {addButtonText}
        </Button>
      )}
    </div>

    {/* View toggle + Toolbar */}
    <Tabs value={viewMode} onValueChange={onViewModeChange}>
      <TabsList>
        <TabsTrigger value="kanban">Pipeline</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
        {showReportTab && <TabsTrigger value="report">Report</TabsTrigger>}
      </TabsList>
      {renderToolbar && <div className="mt-2">{renderToolbar}</div>}
      <TabsContent value="kanban">{renderKanban}</TabsContent>
      <TabsContent value="table">{renderTable}</TabsContent>
      {renderReport && <TabsContent value="report">{renderReport}</TabsContent>}
    </Tabs>
  </div>
</DashboardLayout>
```

---

## 3. שלבי יישום

### Phase 1: יצירת EntityPageShell (בסיס)

- [ ] קובץ `src/components/entity-page/EntityPageShell.tsx`
- [ ] Props interface מלא
- [ ] רינדור Header אחיד (title, subtitle, add button)
- [ ] רינדור View toggle (Pipeline | Table)
- [ ] slots לתוכן kanban + table
- [ ] תמיכה ב-empty state + loading

### Phase 2: מיגרציה של Deals (הכי פשוט)

Deals הוא הכי דומה — אין tabs נוספים, יש Report. טוב כ-proof of concept.

- [ ] Deals משתמש ב-EntityPageShell
- [ ] העברת title/subtitle/addButtonText כ-props
- [ ] renderKanban = DealKanban
- [ ] renderTable = DealTable + DealFilters
- [ ] renderReport = Report content

### Phase 3: מיגרציה של Designs

Designs דומה — יש tabs (Pending/InProgress/Completed) בתוך Table view.

- [ ] renderToolbar = TabsList של category
- [ ] Table מקבל את הנתונים המסוננים לפי activeTab

### Phase 4: מיגרציה של Quotes

Quotes יש tabs (All/Draft/Sent/Approved/Archived) ב-Table.

- [ ] אותו pattern כ-Designs
- [ ] addButtonText = "New Quote", onAddClick = open QuoteBuilder

### Phase 5: מיגרציה של Leads (הכי מורכב)

Leads יש:
- LeadFilters (search, status, source, assignee)
- useTablePreferences (saved views)
- LeadsEmptyState
- Pagination
- QuoteBuilder integration

- [ ] renderToolbar = LeadFilters + Save preferences + Saved views dropdown
- [ ] renderEmptyState = LeadsEmptyState
- [ ] כל הלוגיקה נשארת ב-Leads.tsx, רק ה-layout עובר ל-Shell

---

## 4. קבצים שינויים

| קובץ | שינוי |
|------|------|
| `src/components/entity-page/EntityPageShell.tsx` | **חדש** — קומפוננטת wrapper |
| `src/components/entity-page/index.ts` | **חדש** — export |
| `src/pages/Deals.tsx` | refactor — שימוש ב-EntityPageShell |
| `src/pages/DesignRequests.tsx` | refactor — שימוש ב-EntityPageShell |
| `src/pages/Quotes.tsx` | refactor — שימוש ב-EntityPageShell |
| `src/pages/Leads.tsx` | refactor — שימוש ב-EntityPageShell |

---

## 5. סיכונים והערות

- **Leads** — הכי מורכב (pagination, saved views, demo leads). לבצע אחרון.
- **Quotes** — approve flow ו-archive שונים. ה-dialog (QuoteBuilder) לא "Create Quote" פשוט — זה wizard. עלול לדרוש `addButtonText` + `onAddClick` מיוחדים.
- **Designs** — אין כפתור "Add" כי design requests נוצרים אוטומטית מ-quote approval. `addButtonText` optional.
- **RTL** — ה-Shell צריך לתמוך ב-`dir="rtl"` כמו ב-Leads/Deals.

---

## 6. סטטוס יישום

- [x] **Phase 1** — EntityPageShell נוצר
- [x] **Phase 2** — Deals מיגרט ל-EntityPageShell
- [x] **Phase 3** — Designs מיגרט ל-EntityPageShell
- [x] **Phase 4** — Quotes מיגרט ל-EntityPageShell
- [x] **Phase 5** — Leads מיגרט ל-EntityPageShell

**איחוד נוסף (פברואר 2025):**
- קומפוננטת `EntityToolbar` — toolbar אחיד לכולם (filters + Save + Reset + Saved views + renderExtra)
- Leads, Deals, Quotes, Designs משתמשים כולם ב-EntityPageShell + EntityToolbar
- מבנה אחיד: header, Pipeline/Table tabs, toolbar, תוכן
- קומפוננטת `EntityKanban` — Pipeline אחיד לכולם (DnD, עמודות, Sort dropdown)
- LeadKanban, DealKanban, QuoteKanban, DesignRequestKanban משתמשים כולם ב-EntityKanban
- LeadTable מיגרט ל-DataTable — כל הטבלאות משתמשות עכשיו ב-DataTable
