# HTTP API

Base path: `/api`. Requests and responses use JSON. Authenticated identity comes from the server session, never a supplied user ID. Unknown JSON fields are rejected.

## Sessions and CSRF

1. `GET /auth/csrf` returns `{ "token": "...", "headerName": "X-CSRF-TOKEN" }` and creates a session cookie.
2. Include that cookie and the returned header/token on **every POST, PUT, and DELETE**, including registration and login.
3. Login rotates the session ID and clears the previous CSRF token. Fetch a new token after login. The frontend does this automatically before its next mutation.
4. Logout invalidates the session; the next login starts with a new CSRF token.

The default HttpOnly cookie has SameSite=Lax. Sessions last 12 hours of inactivity. Refreshing the browser preserves the session. Backend restarts require logging in again; accounts and financial data remain in MySQL.

## Endpoints

| Method | Path | Request / result |
|---|---|---|
| GET | `/auth/csrf` | Public CSRF token and header name |
| POST | `/auth/register` | `{ "username": "person", "password": "password123" }` → 201 `{ "id": 1, "username": "person" }` |
| POST | `/auth/login` | Same credentials → 200 user and authenticated session |
| GET | `/auth/me` | Current `{ "id", "username" }` or 401 |
| POST | `/auth/logout` | No body → 204; session invalidated |
| GET | `/categories` | Array of `{ "id", "name" }` |
| GET | `/budgets/2026-10` | `{ "month": "2026-10", "amount": 15000.00 }`; amount is null if unset |
| PUT | `/budgets/2026-10` | `{ "amount": "15000.00" }` → saved budget |
| GET | `/expenses?month=2026-10` | Expense array, newest date then newest ID first |
| POST | `/expenses` | Expense input below → 201 saved expense |
| PUT | `/expenses/42` | Expense input below → saved expense, or 404 if absent/not owned |
| DELETE | `/expenses/42` | 204, or 404 if absent/not owned |
| GET | `/dashboard?month=2026-10` | Monthly budget, totals, remaining, count, category totals |

Expense input:

```json
{
  "description": "Lunch with a friend",
  "amount": "240.50",
  "expenseDate": "2026-10-28",
  "categoryName": "Food & drinks"
}
```

Expense output additionally contains `id`, `categoryId`, and the canonical saved `categoryName`. New categories are inserted in the same transaction as their expense. Existing category names are reused case-insensitively.

Dashboard example:

```json
{
  "month": "2026-10",
  "budget": 15000.00,
  "totalSpent": 240.50,
  "remaining": 14759.50,
  "expenseCount": 1,
  "categories": [
    { "categoryId": 1, "categoryName": "Food & drinks", "total": 240.50, "expenseCount": 1 }
  ]
}
```

Missing budgets have `budget: null` and `remaining: null`; overspending gives a negative remaining balance. Zero is a valid budget. Category totals contain only categories with expenses in that month.

## Validation and errors

- Usernames: 3–32 ASCII letters, digits, underscores; stored lowercase; unique ignoring case.
- Passwords: 8–72 characters and at most 72 UTF-8 bytes. Stored only as salted BCrypt hashes.
- Amounts: up to 10 integer digits and 2 fractional digits; minimum ₹0.01 for expenses and ₹0.00 for budgets.
- Description: 1–160 characters; category: 1–40 characters; surrounding whitespace trimmed.
- Month: `YYYY-MM`; expense date: `YYYY-MM-DD`; supported years 1000–9998. Dates may be past or future.
- 400 invalid input; 401 missing session/invalid credentials; 403 invalid CSRF token; 404 unavailable expense; 409 duplicate username; 503 database unavailable or schema/connection problem.
- Error body: `{ "message": "...", "fields": { "amount": "..." } }`. The optional fields map identifies validation errors. SQL details and password hashes are never sent to clients.
