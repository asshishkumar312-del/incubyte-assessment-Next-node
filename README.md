# Employee Salary Management System (EMS)

**ACME Corp HR Salary Management Platform** — Built for the Incubyte Engineering Assessment  
*Role: Software Craftsperson (Node / React / TypeScript)*  
*Author: Ashish Kumar*

---

## 🌐 Live Production Application & Video Walkthroughs

| Resource | Description & Link |
| :--- | :--- |
| 🚀 **Production Application** | [**incubyte-assessment-next-node.vercel.app**](https://incubyte-assessment-next-node.vercel.app) |
| 🎥 **Walkthrough Video (Part 1)** | [**Watch on Loom (Overview & Architecture)**](https://www.loom.com/share/2c7ed7e1b8d14383aff855ec94cdd5ac) |
| 🎥 **Walkthrough Video (Part 2)** | [**Watch on Loom (Feature Deep Dive & Workflows)**](https://www.loom.com/share/18f1ba217bc341eab2bbd6a336be89e6) |

> 🔑 **Demo HR Manager Credentials:**  
> **Username:** `admin`  
> **Password:** `Admin@123`

---

## 📑 Assessment Artifacts & Documentation

As requested by the assessment guidelines, the following documents detail the architectural thinking, product decisions, and AI-driven development workflows:

| Artifact Document | Summary |
| :--- | :--- |
| 📄 [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) | **One-Page Product Requirements Document (PRD)** outlining goals, user persona, in-scope features, and deliberate exclusions with justifications. |
| 🏗 [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | **System Architecture & Design** including C4/Mermaid diagrams, database ER schema, indexing strategy, and API contracts. |
| ⚖️ [**TRADE_OFFS.md**](./docs/TRADE_OFFS.md) | **Architectural & Product Trade-Offs** (SQLite vs PostgreSQL, Ledger vs In-place updates, Static vs Live FX, Server pagination vs Virtualization). |
| ⚡ [**PERFORMANCE.md**](./docs/PERFORMANCE.md) | **Performance Benchmarks & Optimizations** handling 10,000+ employees with sub-10ms queries, WAL mode, memory tuning, and React 19 rendering safeguards. |
| 🤖 [**AI_DEVELOPMENT_LOG.md**](./docs/AI_DEVELOPMENT_LOG.md) | **AI Workflow & Prompt History** documenting prompts, engineering guardrails, human code reviews, and iterative refinements. |

---

## 📋 Overview

A full-stack, production-quality web application designed for ACME Corp's **HR Manager** to manage compensation and answer executive organizational pay questions across **10,000 employees** in **15 countries** and **11 currencies**.

### Key Architectural Highlights
- **10,000 Seeded Employees:** Transactional batch seed script runs in `< 2.5 seconds`.
- **Append-Only Salary Audit Ledger:** Every salary update records effective date, reason, and actor without mutating historical data.
- **Sub-10ms Analytics Engine:** Multi-currency normalization (USD, GBP, EUR, INR, JPY, etc.), departmental payroll budgets, pay distribution, and gender equity.
- **TanStack Query (React Query v5):** All server state lives in a typed `src/hooks/useAnalytics.ts` layer — no `useEffect` in pages, automatic caching (2 min staleTime), deduplication, and one-call `refetch()`.
- **High-Performance UI:** Next.js 16 (React 19, TypeScript), server-side pagination, debounced search, faceted filters, and responsive Recharts visualizations.
- **Production Test Coverage:** 46 passing tests across backend and frontend test suites.

---

## 🏗 Architecture & Project Layout

```
incubyte/
├── docs/                      # Architectural and assessment artifacts
│   ├── REQUIREMENTS.md        # One-page PRD & scope
│   ├── ARCHITECTURE.md        # Component & ER diagrams, API spec
│   ├── TRADE_OFFS.md          # Technical trade-off evaluations
│   ├── PERFORMANCE.md         # Benchmarks & 10k employee optimizations
│   └── AI_DEVELOPMENT_LOG.md  # Prompt logs and AI collaboration history
│
├── backend/                   # Node.js + Express 5 API
│   ├── src/
│   │   ├── database/          # SQLite connection (WAL mode), migrations, 10k seed script
│   │   ├── middleware/        # JWT auth, error handler, rate limiting
│   │   ├── repositories/      # Data access layer (employee, analytics, auth)
│   │   └── routes/            # REST endpoints
│   ├── tests/                 # Jest + Supertest integration tests (31 tests)
│   └── server.js              # Server entry point
│
└── frontend/                  # Next.js 16 (App Router, React 19, TS, Tailwind v4)
    └── src/
        ├── app/               # Routes: /login, /dashboard, /employees, /analytics
        │   └── layout.tsx     # Root layout — wraps app in AuthProvider + QueryProvider
        ├── components/        # EmployeeTable, Navigation, Modals, Charts
        │   └── QueryProvider.tsx  # Client-side TanStack Query context boundary
        ├── contexts/          # AuthContext with session persistence
        ├── hooks/             # ── SERVER-STATE HOOKS (React Query) ──────────────
        │   └── useAnalytics.ts    # useDashboard(), useFullAnalytics(), useTopEarners()…
        └── lib/               # Typed API client, utility formatters, query client config
            ├── api.ts             # Raw typed fetch wrappers (no state)
            ├── queryClient.ts     # Singleton QueryClient (staleTime, gcTime, retries)
            └── utils.ts           # formatCurrency, CHART_COLORS
```

### Data-Fetching Architecture (React Query)

All server state is managed by **TanStack Query v5** via custom hooks in `src/hooks/`:

| Hook | Query Key | What it fetches |
| :--- | :--- | :--- |
| `useDashboard(currency)` | `['analytics','dashboard', currency]` | summary + top-8 depts + top-5 earners in one `Promise.all` |
| `useFullAnalytics(currency)` | `['analytics', currency]` | summary + depts + countries + distribution + top-10 earners |
| `useAnalyticsSummary(currency)` | `['analytics','summary', currency]` | summary only (composable / prefetch) |
| `useAnalyticsByDepartment(currency)` | `['analytics','byDepartment', currency]` | department averages |
| `useAnalyticsByCountry(currency)` | `['analytics','byCountry', currency]` | country averages |
| `useAnalyticsDistribution(currency, buckets)` | `['analytics','distribution', currency, buckets]` | salary histogram |
| `useTopEarners(currency, limit)` | `['analytics','topEarners', currency, limit]` | top earner list |

**Key behaviours:**
- **No `useEffect`** in page components — zero cascading render warnings.
- **2-minute `staleTime`** — instant cache hits when switching between Dashboard and Analytics.
- **`isFetching`** drives the refresh spinner for background refetch UX.
- **`refetch()`** replaces manual retry counters — single source of truth.
- **`Promise.all`** inside `queryFn` means all data lands atomically (no intermediate loading flicker between fields).

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Backend Setup & Seeding (10,000 Employees)

```bash
cd backend
npm install
npm run seed          # Seeds 10,000 employees + 20,000+ salary events (< 3s)
npm run dev           # Starts API server on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Starts Next.js app on http://localhost:3000
```

### 3. HR Manager Credentials
- **Production URL:** [https://incubyte-assessment-next-node.vercel.app](https://incubyte-assessment-next-node.vercel.app)
- **Local URL:** [http://localhost:3000](http://localhost:3000)
- **Username:** `admin`
- **Password:** `Admin@123`

---

## 🧪 Comprehensive Automated Testing

The project maintains production-grade test coverage across both backend and frontend layers:

### Backend Tests (31 Tests Passing)
Covers authentication, employee CRUD, salary ledger revisions, multi-currency analytics, pagination, and error handling:
```bash
cd backend
npm test
```
```text
PASS tests/analytics.test.js
PASS tests/auth.test.js
PASS tests/employees.test.js
Test Suites: 3 passed, 3 total
Tests:       31 passed, 31 total
```

### Frontend Tests (15 Tests Passing)
Covers `EmployeeTable` rendering, badge formatting, action dispatching, `AuthContext` token state, and currency/date utilities:
```bash
cd frontend
npm test
```
```text
PASS src/lib/utils.test.ts
PASS src/contexts/AuthContext.test.tsx
PASS src/components/EmployeeTable.test.tsx
Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

---

## ✨ Feature Matrix

| Feature | HR Manager Capability |
| :--- | :--- |
| 📋 **Employee Master Table** | Search, filter by 4 dimensions, sort across all columns, and paginate through 10,000 records in `< 5ms`. |
| 💰 **Salary Ledger & Revisions** | Adjust compensation with effective dates and mandatory reasoning (Promotions, Annual Merit, Market Adjustment). |
| 📊 **Executive Dashboard** | Real-time organization metrics: total monthly payroll, headcount, average salary converted to any baseline currency. |
| 🌍 **Multi-Currency Normalization** | Instant conversion across 11 currencies (USD, GBP, EUR, INR, JPY, CAD, AUD, SGD, BRL, MXN, PLN). |
| 📈 **Pay Equity Analysis** | Gender ratio distributions and departmental compensation disparity indicators. |
| 🏆 **Top Earners Leaderboard** | Filter top earners globally or by departmental slice. |
| 📤 **Streaming CSV Export** | Export filtered or full employee subsets directly to CSV for spreadsheet interoperability. |
| 🗑️ **Soft Deactivation** | Deactivate personnel without destroying audit trails or historical salary analytics. |

---

## 📜 License
MIT © 2026 Ashish Kumar
