# Stitch MCP — הגדרת GCP וגישה לקוד HTML

**מטרה:** להפעיל את Stitch MCP כדי למשוך קוד HTML מעיצובי DemoCRM ולהמיר ל־React/hadaryaCRM.

---

## 1. תצורה נוכחית (כבר מוגדרת)

ב־`~/.cursor/mcp.json`:

```json
"stitch": {
  "command": "npx",
  "args": ["-y", "stitch-mcp"],
  "env": {
    "GOOGLE_CLOUD_PROJECT": "democrm-489100"
  }
}
```

---

## 2. שלבי הגדרה

### שלב 1: Xcode License (השגיאה הנוכחית)

השגיאה:
```
You have not agreed to the Xcode license agreements.
```

**פתרון:**
```bash
sudo xcodebuild -license
```
להמשיך עד הסוף ולאשר את הרישיון.

---

### שלב 2: gcloud Auth

```bash
# התחברות
gcloud auth login

# פרויקט GCP
gcloud config set project democrm-489100

# Application Default Credentials (ADC)
gcloud auth application-default set-quota-project democrm-489100

# אפשרות: הפעלת Stitch API (אם נדרש)
# gcloud beta services mcp enable stitch.googleapis.com

# ADC login
gcloud auth application-default login
```

---

### שלב 3: אימות

לאחר ההגדרה, אפשר לבדוק:

1. **הפעלת Cursor מחדש** — כדי לטעון את ה־MCP מחדש.
2. **קריאה ל-Stitch MCP** — `fetch_screen_code` עם projectId + screenId.

---

## 3. כלי Stitch MCP

**מה קיים אצלך:**
- `fetch_screen_code` — HTML/קוד
- `fetch_screen_image` — screenshot

**מה עשוי להיות ב־Stitch MCP מלא (אם מותקן גרסה עם tools נוספים):**
- `list_projects` — רשימת פרויקטים
- `list_screens` — רשימת מסכים + **screenId**
- `get_screen` — מטא־דאטה
- `extract_design_context` — design tokens

**אם אין `list_screens`:** אפשר לנסות `screenId` ידנית:
- `"0"`, `"1"`, `"2"`, ...
- או לבדוק ב-Stitch UI אם ה־URL מציג screenId.

---

## 4. Workflow: HTML → React

1. **משיכת HTML** — `fetch_screen_code(projectId: "12969395350507001707", screenId: "?")`
2. **ניתוח** — זיהוי מבנה (divs, classes, layout)
3. **המרה** — העברה ל־JSX עם רכיבי hadaryaCRM:
   - `<div class="card">` → `<Card>`
   - classes → Tailwind / shadcn
   - מבנה טבלה → `DataTable`
   - מבנה Kanban → `EntityKanban` + `LeadCard`
4. **התאמה** — חיבור ל־data hooks, Supabase, routing

---

## 5. DemoCRM — נתונים

| שדה | ערך |
|-----|-----|
| **projectId** (מ־URL) | `12969395350507001707` |
| **GOOGLE_CLOUD_PROJECT** (mcp.json) | `democrm-489100` |
| **screenId** | לא ידוע — צריך `list_screens` או ניחוש |

**הערה:** ייתכן ש־`projectId` מ־URL Stitch שונה מ־`GOOGLE_CLOUD_PROJECT` ב־GCP.  
`democrm-489100` הוא פרויקט GCP; `12969395350507001707` מזהה פרויקט ב־Stitch.  
אחרי ה-auth כדאי לבדוק אם `list_projects` מחזיר את הפרויקט ואת ה־ID הנכון.

---

## 6. צ'קליסט

- [ ] `sudo xcodebuild -license` — אישור
- [ ] `gcloud auth login`
- [ ] `gcloud config set project democrm-489100`
- [ ] `gcloud auth application-default set-quota-project democrm-489100`
- [ ] `gcloud auth application-default login`
- [ ] הפעלת Cursor מחדש
- [ ] בדיקת `fetch_screen_code` עם projectId + screenId
