# Flow: טיקט → חקירה → תיקון → PR

## סקירה

1. **מקבל טיקט** → בודק שיש מספיק מידע (מספיק "בשר").
2. **שולח מספר טיקט ל-Cursor** → האג'נט:
   - מחלץ את כל המידע מהטיקט
   - מזהה את ה-**skill** שמגדיר איך לדבג ולחקור את הבאג (לפי שירות/פרויקט)
   - מתחבר ל-**Langfuse** ומחלץ מידע על הסשן
   - מריץ **gcloud CLI** ומאתר לוגים רלוונטיים
   - מסכם: "הנה מצאתי את הבעיה – זה הקומיט של נאור"
   - מציע תיקון
3. **אתה בודק**, מדייק אם צריך.
4. **מריץ command** שפותח PR מסודר.

---

## דרישות מקדימות

| רכיב | שימוש ב-flow |
|------|---------------|
| **מערכת טיקטים** | Linear / Jira / GitHub Issues / מייל – מקור למספר הטיקט והתוכן. |
| **Langfuse** | API (או SDK) לשליפת traces/sessions לפי מזהה סשן/משתמש מהטיקט. |
| **gcloud** | `gcloud logging read` (או מקביל) לשליפת לוגים לפי זמן/שירות/משתמש. |
| **Git + GitHub** | branch, commit, ו-`gh pr create` (או סקריפט) ל-PR. |
| **Cursor** | Rule + Skill שמפעילים את ה-flow כשמזינים טיקט. |

---

## איך ליצור את ה-flow

### אפשרות א': הכל בתוך Cursor (Rule + Skill)

- **Rule**: כשהמשתמש כותב "חקור טיקט X" / "debug ticket #123" / "investigate ticket …" – להפעיל את ה-flow ולא לסטות ממנו.
- **Skill**: קובץ `SKILL.md` אחד (או skill לכל שירות) שמגדיר:
  1. איך לחלץ מידע מהטיקט (שדות, session id, user id, timestamp).
  2. איך לזהות איזה skill/פרויקט רלוונטי (לפי תיאור/תגיות/פרויקט).
  3. איך לשלוף מ-Langfuse (API/פקודות).
  4. אילו פקודות gcloud להריץ (פרויקט, filter, טווח זמן).
  5. איך לסכם סיבה ולבנות הצעת תיקון.
  6. איזה command להריץ בסוף לפתיחת PR (למשל `gh pr create` עם template).

זה מה שיצרתי לך: Rule ב-`.cursor/rules/` ו-Skill ב-`.cursor/skills/debug-from-ticket/`.

### אפשרות ב': סקריפט מאחד את השלבים

סקריפט (למשל `scripts/ticket-to-pr.sh` או Node/Python) ש:

1. מקבל מספר טיקט (ואולי מקור: linear/jira/github).
2. מוודא שיש "מספיק בשר" (למשל: תיאור לא ריק, יש session/user/timestamp אם רלוונטי).
3. קורא API של הטיקטים ומדפיס סיכום ל-stdout.
4. פותח Cursor (או שולח ל-Agent) עם קונטקסט מוכן: "חקור טיקט #X. המידע הבא: …".
5. אחרי שהמשתמש מאשר – מריץ `git checkout -b fix/TICKET-123`, commit, ו-`gh pr create`.

אפשר לשלב עם האפשרות א': הסקריפט רק מאמת טיקט ומכין קונטקסט; Cursor מריץ את ה-Skill.

### אפשרות ג': שילוב

- **Cursor (Rule + Skill)** מטפלים בחקירה, Langfuse, gcloud והצעת תיקון.
- **פקודה אחת** (או shortcut) שאתה מריץ אחרי אישור: פותחת branch, עושה commit, ו-`gh pr create` עם title/body מהטיקט.

---

## צעדי הטמעה מומלצים

1. **הגדר מקור טיקטים**  
   החלט איפה הטיקטים (Linear/Jira/GitHub) והאם יש API. אם אין – העתקת תוכן טיקט ל-Cursor מספיקה להתחלה.

2. **הוסף Rule ב-Cursor**  
   קובץ ב-`.cursor/rules/` שמזהה ביטויים כמו "חקור טיקט", "debug ticket", "investigate ticket" ומפנה ל-skill.

3. **הוסף Skill "debug-from-ticket"**  
   ב-`.cursor/skills/debug-from-ticket/` (או ב-`~/.cursor/skills/` אם רוצה גלובלי):
   - הוראות לחילוץ מידע מהטיקט.
   - רשימת skills/פרויקטים לפי סוג באג (אופציונלי).
   - הוראות ל-Langfuse (מפתחות ב-env, דוגמאות API).
   - הוראות ל-gcloud (פרויקט, filters).
   - תבנית לסיכום ולתיקון.
   - דוגמת `gh pr create` עם title/body.

4. **הגדר משתני סביבה (אם צריך)**  
   למשל: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `GCP_PROJECT`, או קובץ `.env` שלא נשמר ב-git.

5. **תבנית פתיחת PR**  
   סקריפט או alias שמקבל branch name + title + body (למשל מהטיקט) וקורא ל-`gh pr create`.

---

## דוגמת שימוש

1. מקבל טיקט #442: "המשתמש רואה 500 כשנכנס ל-dashboard, session id: abc-123."
2. בודק: יש תיאור + session id → מספיק בשר.
3. פותח Cursor ומקליד:
   ```
   חקור טיקט #442. מקור: Linear (או: הנה התוכן: …).
   ```
4. האג'נט רץ לפי ה-Skill: מחלץ טיקט, Langfuse, gcloud, מציע "הבעיה בקומיט X של נאור".
5. אתה מתקן קוד (או מאשר הצעת האג'נט), בודק.
6. מריץ:
   ```bash
   ./scripts/open-fix-pr.sh 442 "fix: dashboard 500 for session abc-123"
   ```
   או:
   ```bash
   git checkout -b fix/TICKET-442 && git add -A && git commit -m "fix: ..." && gh pr create --title "Fix dashboard 500 (TICKET-442)" --body "..."
   ```

---

## קבצים שנוצרו בפרויקט

- `maestro/flow-ticket-to-pr.md` – המסמך הזה (תכנון והוראות).
- `.cursor/rules/ticket-debug-flow.mdc` – מפעיל את ה-flow כשיש טיקט.
- `.cursor/skills/debug-from-ticket/SKILL.md` – הוראות לחקירה, Langfuse, gcloud והצעת PR.
- `scripts/open-fix-pr.sh` – דוגמת סקריפט לפתיחת PR: `./scripts/open-fix-pr.sh 442 "fix: תיאור"`.

אם מערכת הטיקטים או שמות הפרויקטים שונים – מעדכנים את ה-Skill (ולא רק את ה-Rule).
