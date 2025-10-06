-- Backfill script to assign existing purchases to launches based on purchase date
-- This should be run after creating launches manually or importing historical launches

-- NOTE: This is a one-time backfill script that assigns purchases to launches
-- For new purchases, the assignment happens automatically in attributionService.ts

-- Update purchases that fall within any launch date range
-- Priority given to the most recent launch if there are overlapping launches
UPDATE purchases p
SET launch_id = l.id
FROM launches l
WHERE p.user_id = l.user_id
  AND p.purchased_at BETWEEN l.start_date AND l.end_date
  AND p.launch_id IS NULL
  AND l.status IN ('active', 'completed', 'archived')
ORDER BY l.start_date DESC;

-- Note: If a purchase falls within multiple launches, the most recent launch (by start_date) wins
