# Kharcha Paani

**Plan your budget. Track your spending. Know where your money goes.**

A full-stack monthly expense manager built with **React, Spring Boot, and MySQL**. It uses handwritten SQL through Spring JDBC to demonstrate relational database design, transactions, joins, and aggregation.

## Features

- Personal accounts with BCrypt password hashing and session-based authentication.
- Independent monthly budgets with spending totals, progress, and remaining balance.
- Add, edit, and delete expenses with custom categories.
- Search expenses, filter by category, and view category spending charts.
- Responsive interface, INR formatting, and persistent MySQL storage.

Expenses can be recorded without a budget. Overspending shows a negative balance; budgets do not carry forward between months.

## Tech stack

| Frontend | Backend | Database |
| --- | --- | --- |
| React 19, Vite 6, Tailwind CSS 4, GSAP | Java 21, Spring Boot 3.5, Spring Security, Spring JDBC | MySQL, InnoDB |

## Run locally

**Requirements:** JDK 21+, Maven 3.6.3+, Node.js 22.12.x or newer within 22.x (or Node 24.x / 26+), npm, and MySQL 8.0.16+.

### 1. Clone the repository

```sh
git clone git@github.com:Manthan-Karnani/kharchaPaani.git
cd kharchaPaani
```

### 2. Set up MySQL

Run as a MySQL administrator, replacing the example password:

```sql
CREATE DATABASE IF NOT EXISTS kharcha_paani
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'kharcha_app'@'localhost' IDENTIFIED BY 'choose_your_own_password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES
    ON kharcha_paani.* TO 'kharcha_app'@'localhost';
```

If you already have a database user, grant it these permissions instead. The backend creates missing tables on startup and preserves existing records; it does not migrate older table definitions.

### 3. Start the backend

From the repository root, in Bash or Zsh:

```sh
cd backend
export DB_USERNAME=kharcha_app
export DB_NAME=kharcha_paani
printf 'MySQL password: '
read -r -s DB_PASSWORD
export DB_PASSWORD
printf '\n'
mvn spring-boot:run
```

The backend runs at `http://localhost:8080`. MySQL defaults to `localhost:3306`; set `DB_HOST` and `DB_PORT` for another server. See [.env.example](.env.example) for configuration. **Spring Boot does not automatically load `.env` files.**

### 4. Start the frontend

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** and select **Create account**. Vite proxies `/api` requests to the backend. Your app login is separate from your MySQL credentials.

## Project structure

```text
backend/    Spring Boot API, authentication, services, and tests
frontend/   React interface, styles, and component tests
database/   Schema, application SQL queries, and optional sample data
docs/       API reference, ER diagram, and verification notes
```

The database contains four tables: `users`, `monthly_budgets`, `categories`, and `expenses`. Financial amounts use `DECIMAL(12,2)` and Java `BigDecimal`. Queries are scoped to the signed-in user, with foreign keys enforcing category ownership.

## Tests and builds

Run commands from the indicated directory:

| Directory | Test | Build |
| --- | --- | --- |
| `frontend/` | `npm test` | `npm run build` |
| `backend/` | `mvn test` | `mvn package` |

Standard tests run without MySQL; real MySQL integration tests are opt-in through `TEST_DB_NAME`, using a separate database ending in `_test`. The frontend builds to `frontend/dist/`; the backend builds to `backend/target/kharcha-paani-1.0.0.jar`. They are served separately.

## Documentation

- [API reference](docs/API.md) — endpoints, sessions, CSRF, and validation.
- [ER diagram](docs/ER-diagram.md) — relationships and database constraints.
- [Schema](database/schema.sql) and [queries](database/queries.sql) — the actual SQL used by the backend.
- [Sample data](database/sample_data.sql) — optional; register a `demo` account first, then run the script against `kharcha_paani`.
