-- Kharcha Paani: the actual SQL loaded and executed by the Spring JDBC backend.
-- Each '-- name:' heading identifies one query. Values use bound parameters.
-- userId always comes from the authenticated server-side session.
-- For month queries, start is inclusive and end is the first day of next month.

-- name: userByUsername
SELECT id, username, password_hash FROM users WHERE username = :username;

-- name: insertUser
INSERT INTO users (username, password_hash) VALUES (:username, :passwordHash);

-- name: listCategories
SELECT id, name FROM categories WHERE user_id = :userId ORDER BY name;

-- name: ensureCategory
-- Reuse an existing category under the case-insensitive unique constraint.
INSERT INTO categories (user_id, name) VALUES (:userId, :categoryName)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

-- name: categoryByName
SELECT id, name FROM categories WHERE user_id = :userId AND name = :categoryName;

-- name: budgetForMonth
SELECT amount FROM monthly_budgets WHERE user_id = :userId AND budget_month = :month;

-- name: saveBudget
INSERT INTO monthly_budgets (user_id, budget_month, amount) VALUES (:userId, :month, :amount)
ON DUPLICATE KEY UPDATE amount = :amount;

-- name: listExpenses
SELECT e.id, e.description, e.amount, e.expense_date, c.id AS category_id, c.name AS category_name
FROM expenses e JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
WHERE e.user_id = :userId AND e.expense_date >= :start AND e.expense_date < :end
ORDER BY e.expense_date DESC, e.id DESC;

-- name: expenseById
SELECT e.id, e.description, e.amount, e.expense_date, c.id AS category_id, c.name AS category_name
FROM expenses e JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
WHERE e.user_id = :userId AND e.id = :id;

-- name: insertExpense
INSERT INTO expenses (user_id, category_id, description, amount, expense_date)
VALUES (:userId, :categoryId, :description, :amount, :expenseDate);

-- name: updateExpense
UPDATE expenses SET category_id = :categoryId, description = :description,
    amount = :amount, expense_date = :expenseDate
WHERE id = :id AND user_id = :userId;

-- name: deleteExpense
DELETE FROM expenses WHERE id = :id AND user_id = :userId;

-- name: monthlyTotals
SELECT COALESCE(SUM(amount), 0.00) AS total_spent, COUNT(*) AS expense_count
FROM expenses WHERE user_id = :userId AND expense_date >= :start AND expense_date < :end;

-- name: categoryTotals
SELECT c.id AS category_id, c.name AS category_name, SUM(e.amount) AS total, COUNT(*) AS expense_count
FROM expenses e JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
WHERE e.user_id = :userId AND e.expense_date >= :start AND e.expense_date < :end
GROUP BY c.id, c.name ORDER BY total DESC, c.name;
