-- Kharcha Paani | MySQL 8.0.16+ | applied automatically on backend startup.
-- No DROP, TRUNCATE, or automatic sample data. Existing records are preserved.
-- Uses the database selected by the connection (DB_NAME in the backend).

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(32) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS monthly_budgets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    budget_month DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_budget_user_month UNIQUE (user_id, budget_month),
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_budget_amount CHECK (amount >= 0),
    CONSTRAINT chk_budget_month CHECK (DAYOFMONTH(budget_month) = 1)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(40) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_category_user_name UNIQUE (user_id, name),
    -- The composite key lets expenses enforce category ownership in SQL too.
    CONSTRAINT uq_category_id_user UNIQUE (id, user_id),
    CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    description VARCHAR(160) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_expense_user_date (user_id, expense_date),
    INDEX idx_expense_category_user (category_id, user_id),
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_expense_category_owner FOREIGN KEY (category_id, user_id) REFERENCES categories(id, user_id),
    CONSTRAINT chk_expense_amount CHECK (amount > 0)
) ENGINE=InnoDB;
