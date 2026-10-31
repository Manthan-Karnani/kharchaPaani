# Verification — 28 October 2026

## Missing-table login fix — 29 October 2026

- Enabled Spring Boot SQL initialization for MySQL and included the canonical `database/schema.sql` in the executable jar. Missing databases are created by the JDBC connection when permissions allow, and missing tables are created before API requests are accepted.
- Removed hardcoded database selection from the table script so startup respects `DB_NAME`, including existing databases and separate test databases. No existing tables or records are dropped, reset, or seeded.
- Added a startup/restart regression test using Spring Boot's actual SQL initialization with mocked JDBC, verifying all four non-destructive table statements run on each startup. Updated missing-schema errors and setup/permission instructions.
- Backend packaging passed: 19 unit/API/startup tests passed; 2 opt-in MySQL tests skipped because test database credentials were not configured. Confirmed both SQL resources are included in the rebuilt jar.
- Live MySQL login was not verified in this session because database credentials were not available. Restart the existing backend in its configured terminal to apply the fix.

## Completed

- Frontend production build with Vite.
- 5 Node tests: INR formatting, input precision/range, month/year navigation, local default dates, missing/zero/overspent budgets.
- 7 frontend interaction tests with mocked API responses: dashboard filtering, missing budgets, inline categories, exact amount submission, zero budgets, deletion failures, dialog keyboard/focus handling, and registration/login.
- 16 backend tests: service calculations, password hashing/byte limits, owner scoping, month validation, login/logout sessions, CSRF, duplicate usernames, invalid input, database-error responses, and loading the actual SQL catalog.
- Runnable Spring Boot jar packaged successfully.
- npm dependency audit: no reported vulnerabilities after updating the test runner.
- Live browser: login page renders; a submitted login without MySQL returns the intended connection-error message rather than a blank page or incorrect-password message.
- Visual checks of populated and empty dashboard components using a **separate, read-only sample-data fixture**; also checked the dashboard at a 390-pixel viewport width. This fixture is not part of the application, does not connect to MySQL, and does not provide a login bypass.

## Database follow-up — 28 October 2026

After database credentials were supplied, the saved Workbench connection `money_manager` was found to use the actual MySQL username `root`. The supplied password was verified with that username, and all four application tables were confirmed to exist.

All **20 backend tests passed**, including both actual MySQL integration tests against the separate test database on MySQL 9.7.0. These tests verified expense/category creation, case-insensitive category reuse, exact decimal totals, monthly boundaries, updates/deletion, unique usernames, and ownership constraints; test records were rolled back. Two regression tests now cover helpful error messages for failed registration transactions and missing tables.

The earlier 16-test result above describes the original implementation run. Complete browser registration and persistence across server restarts still require their own acceptance check; no user accounts or expense records were added to the main database during these diagnostics.

The production app has no in-memory or localStorage fallback for financial records. It displays a connection error if MySQL cannot be reached. Follow `README.md` to configure MySQL, then run the opt-in tests and browser acceptance checklist.

## Kharcha Paani rename — 28 October 2026

- Updated UI branding, browser metadata, Java packages and application class, Maven/npm names, SQL setup defaults, environment examples, and documentation.
- All 19 frontend tests passed, and the Vite production build succeeded.
- All 18 backend unit/API tests passed, with the two opt-in MySQL integration tests skipped. The renamed executable jar was packaged successfully. The sandbox verification used `mvn -o package -DargLine=-javaagent:/Users/manthan/.m2/repository/org/mockito/mockito-core/5.23.0/mockito-core-5.23.0.jar` to load Mockito explicitly because dynamic agent attachment was unavailable.
- No old branding remains in project text files. Existing databases were not modified; existing installations should retain their current `DB_NAME` and `DB_USERNAME` settings.
- `login-preview.png` and `dashboard-preview.png` remain historical screenshots with the previous branding. Refreshing them was blocked by unavailable browser access and disabled computer-use permission.
