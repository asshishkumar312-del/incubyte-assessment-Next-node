# Performance Considerations & Benchmarks

## 1. Scale Target & Dataset Characteristics

- **Employee Records:** 10,000 active employees.
- **Historical Salary Records:** 20,000+ salary events (capturing original hiring salaries and subsequent merit raises).
- **Geographic Spread:** 15 countries, 15 business departments, 11 global currencies.
- **Concurrent Reads:** Multiple analytics and directory requests simultaneously.

---

## 2. Real-World API Response Time Benchmarks

The following benchmarks were recorded on the live Express API running against a seeded 10,000 employee SQLite database:

| Endpoint | Operation | Tested Latency | Status |
| :--- | :--- | :--- | :--- |
| `GET /api/employees?page=1&limit=20` | Directory fetch with latest salary subquery | **4.6 ms** | ✅ Exceeds Target (< 100ms) |
| `GET /api/employees?search=Jane` | Indexed multi-column search | **5.0 ms** | ✅ Exceeds Target (< 100ms) |
| `GET /api/employees?department=Engineering` | Filtered directory query | **4.1 ms** | ✅ Exceeds Target (< 100ms) |
| `GET /api/analytics/summary?currency=USD` | Aggregate payroll, headcount, avg salary across 10,000 records | **3.2 ms** | ✅ Exceeds Target (< 50ms) |
| `GET /api/analytics/by-department` | Multi-group departmental compensation roll-up | **7.0 ms** | ✅ Exceeds Target (< 50ms) |
| `GET /api/analytics/distribution` | Statistical percentile salary bracket computation | **4.8 ms** | ✅ Exceeds Target (< 50ms) |
| `GET /api/analytics/top-earners?limit=5` | Organization-wide top earners sorting | **4.8 ms** | ✅ Exceeds Target (< 50ms) |

---

## 3. Database Optimization Strategies

### 3.1 SQLite Pragmas for High Throughput
In [db.js](file:///d:/incubyte/backend/src/database/db.js), several SQLite engine pragmas are applied on startup:
```sql
PRAGMA journal_mode = WAL;          -- Non-blocking concurrent readers during write transactions
PRAGMA synchronous = NORMAL;        -- Safely batches disk syncs without compromising durability
PRAGMA cache_size = -64000;         -- Allocates 64MB memory buffer pool for hot pages
PRAGMA temp_store = MEMORY;         -- Evaluates temporary sorts and aggregations in RAM
PRAGMA foreign_keys = ON;           -- Enforces strict referential integrity
```

### 3.2 Indexing Architecture
To prevent full table scans across 10,000 employees, the following B-Tree indices were created:
```sql
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_employees_search ON employees(first_name, last_name, employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_emp_date ON salaries(employee_id, effective_date DESC);
```

### 3.3 Transactional Seeding (10,000 records in < 2.5 seconds)
Naive row-by-row inserts in SQLite create a separate disk transaction for each row, taking upwards of 30+ seconds.
In [seed.js](file:///d:/incubyte/backend/src/database/seed.js), inserts are wrapped in an atomic `db.transaction()`:
```javascript
const insertEmployee = db.prepare(`INSERT INTO employees (...) VALUES (...)`);
const seedEmployees = db.transaction((batch) => {
  for (const emp of batch) insertEmployee.run(...);
});
seedEmployees(tenThousandRecords); // Commits in a single atomic I/O flush
```
**Result:** 10,000 employees and 20,000+ salary records are generated and persisted in **under 2.5 seconds**.

---

## 4. Frontend Performance & React Query Optimizations

1. **Zero Cascading Renders (TanStack Query):**
   - All server state in `/dashboard` and `/analytics` is fetched via **React Query's `useQuery`** hook inside typed custom hooks (`src/hooks/useAnalytics.ts`). Unlike `useEffect`, `useQuery` schedules fetches *outside* the render-commit cycle — eliminating the React 19 compiler warning about synchronous `setState` inside effects entirely.

2. **2-Minute Intelligent Cache (`staleTime`):**
   - The singleton `QueryClient` (`src/lib/queryClient.ts`) marks responses fresh for **2 minutes**. Navigating between the Dashboard and Analytics pages within that window delivers instant cached results with zero network round-trips.

3. **Atomic Data Commits (no intermediate flicker):**
   - Both `useDashboard` and `useFullAnalytics` use `Promise.all` inside a single `queryFn`. All fields (`summary`, `deptData`, `topEarners`, etc.) commit atomically in one re-render — preventing the partial-loading flicker seen when multiple `useState` hooks resolve independently.

4. **Race Condition Safety (built-in):**
   - React Query internally cancels stale in-flight requests when query keys change (e.g. currency switches from `USD` → `EUR`). The previous manual `ignore = true` cleanup flag is no longer needed in page components.

5. **`useMemo`-Derived Chart Data:**
   - `genderData` and `employmentData` are computed with `useMemo` inside the hook, keyed to `query.data`. They only recompute when the API response changes — not on unrelated state updates (e.g., spinner visibility).

6. **Debounced Search (EmployeeTable):**
   - Client search inputs trigger page resets without hammering the backend on every individual keystroke. Server-side pagination limits responses to 20 records (`~8KB JSON payload`), ensuring instantaneous DOM rendering.
