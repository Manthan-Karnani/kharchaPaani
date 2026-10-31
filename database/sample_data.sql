-- OPTIONAL: run only after creating an account named 'demo' through the website.
-- The app hashes that account's password. This script never inserts plaintext passwords.
-- Change the username below to an existing account if needed.
USE kharcha_paani;
SET @demo_username = 'demo';
SET @demo_user_id = (SELECT id FROM users WHERE username = @demo_username);
SET @demo_month = CAST(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01') AS DATE);

START TRANSACTION;

-- Preserve an existing budget. No update if one has already been set.
INSERT INTO monthly_budgets (user_id, budget_month, amount)
SELECT @demo_user_id, @demo_month, 15000.00
WHERE @demo_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM monthly_budgets WHERE user_id = @demo_user_id AND budget_month = @demo_month);

INSERT INTO categories (user_id, name)
SELECT @demo_user_id, 'Food & drinks' WHERE @demo_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
INSERT INTO categories (user_id, name)
SELECT @demo_user_id, 'Groceries' WHERE @demo_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
INSERT INTO categories (user_id, name)
SELECT @demo_user_id, 'Transport' WHERE @demo_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

-- Each demo expense is inserted once per current month, so reruns preserve data.
INSERT INTO expenses (user_id, category_id, description, amount, expense_date)
SELECT @demo_user_id, c.id, 'Demo: Coffee with a friend', 180.00, CURRENT_DATE()
FROM categories c WHERE c.user_id = @demo_user_id AND c.name = 'Food & drinks'
  AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = @demo_user_id AND e.description = 'Demo: Coffee with a friend' AND e.expense_date >= @demo_month);
INSERT INTO expenses (user_id, category_id, description, amount, expense_date)
SELECT @demo_user_id, c.id, 'Demo: Weekly groceries', 1250.50, CURRENT_DATE()
FROM categories c WHERE c.user_id = @demo_user_id AND c.name = 'Groceries'
  AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = @demo_user_id AND e.description = 'Demo: Weekly groceries' AND e.expense_date >= @demo_month);
INSERT INTO expenses (user_id, category_id, description, amount, expense_date)
SELECT @demo_user_id, c.id, 'Demo: Metro recharge', 300.00, CURRENT_DATE()
FROM categories c WHERE c.user_id = @demo_user_id AND c.name = 'Transport'
  AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = @demo_user_id AND e.description = 'Demo: Metro recharge' AND e.expense_date >= @demo_month);

COMMIT;

SELECT IF(@demo_user_id IS NULL, 'No account found. Register the demo username in the website first.', 'Sample data ready; refresh the dashboard.') AS result;
