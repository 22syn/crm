-- Seed deals for dashboard display (active deals, revenue, activity feed, charts)
-- Uses explicit timestamps spread across recent months for "Deals by Month" chart

INSERT INTO public.deals (id, title, stage, amount, expected_close_date, probability, notes, created_at, updated_at)
VALUES
  -- Closed won - for Revenue stat and chart
  (gen_random_uuid(), 'חתימת חוזה עם לקוח פרטי - תל אביב', 'closed_won', 45000, '2026-02-15', 100, NULL, '2026-02-14 10:00:00+00', now()),
  (gen_random_uuid(), 'פרויקט משרדים - הרצליה פיתוח', 'closed_won', 125000, '2026-02-10', 100, NULL, '2026-02-08 14:30:00+00', now()),
  (gen_random_uuid(), 'הזמנת ריהוט לחדר ישיבות - אילת', 'closed_won', 28000, '2026-01-25', 100, NULL, '2026-01-22 09:15:00+00', now()),
  (gen_random_uuid(), 'מטבחון משרדי - חיפה', 'closed_won', 62000, '2026-01-18', 100, NULL, '2026-01-15 11:00:00+00', now()),
  (gen_random_uuid(), 'ריהוט עץ מלא - ירושלים', 'closed_won', 89000, '2026-01-05', 100, NULL, '2025-12-28 16:45:00+00', now()),
  (gen_random_uuid(), 'שולחנות ועמדות עבודה - סטארטאפ', 'closed_won', 35000, '2025-12-20', 100, NULL, '2025-12-18 10:30:00+00', now()),
  (gen_random_uuid(), 'משרד עו"ד - נתניה', 'closed_won', 47000, '2025-11-28', 100, NULL, '2025-11-22 13:00:00+00', now()),
  (gen_random_uuid(), 'חדר אוכל לעובדים - פארק תעשייה', 'closed_won', 38000, '2025-10-15', 100, NULL, '2025-10-10 09:30:00+00', now()),
  -- Active deals - for Active Deals stat
  (gen_random_uuid(), 'משרד חדש - רמת גן', 'negotiation', 78000, '2026-03-15', 75, 'ממתינים לאישור תקציב', '2026-02-18 08:00:00+00', now()),
  (gen_random_uuid(), 'הזמנה גדולה - רשת בתי קפה', 'contract_sent', 156000, '2026-03-01', 90, NULL, '2026-02-16 12:00:00+00', now()),
  (gen_random_uuid(), 'ריהוט לובי - בניין עסקים', 'proposal', 42000, '2026-03-20', 40, NULL, '2026-02-20 09:30:00+00', now()),
  (gen_random_uuid(), 'עיצוב ריהוט משרדי - סטארטאפ tech', 'negotiation', 54000, '2026-02-28', 65, NULL, '2026-02-17 15:20:00+00', now()),
  (gen_random_uuid(), 'חידוש משרד - נהריה', 'proposal', 31000, '2026-03-10', 50, NULL, '2026-02-19 11:00:00+00', now()),
  (gen_random_uuid(), 'שולחנות פגישות - חברת ביטוח', 'contract_sent', 28000, '2026-02-25', 85, NULL, '2026-02-12 14:00:00+00', now()),
  -- Closed lost - for realistic mix
  (gen_random_uuid(), 'מכרז עירוני - לא זכינו', 'closed_lost', 95000, '2026-01-30', 0, 'בחרו ספק אחר', '2026-01-25 09:00:00+00', now());
