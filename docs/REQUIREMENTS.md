# Product Requirements Document (PRD)
## ACME Corp — Employee Salary Management Platform

**Author:** Ashish Kumar  
**Target User Persona:** HR Manager (Global Total Rewards & People Operations)  
**Target Scale:** 10,000+ Employees across 15 Countries  
**Status:** Approved & Implemented  

---

## 1. Executive Summary & Problem Statement

ACME Corporation has scaled to **10,000 employees** spanning 15 countries and 11 currencies. Historically, compensation data was maintained across fractured, unversioned Excel spreadsheets. This manual workflow introduced severe operational liabilities:
- **Formula corruption and human error** during manual row editing and macro execution.
- **Lack of auditability**: Inability to determine who adjusted a salary, when the revision occurred, or why.
- **Multi-currency confusion**: Inability to quickly aggregate global payroll totals without error-prone forex calculations.
- **Slow executive reporting**: Answering basic questions (e.g., *"What is our total engineering payroll in EUR?"* or *"Do we have gender pay discrepancies in sales?"*) took days of manual spreadsheet pivoting.

The goal is to replace legacy spreadsheets with a secure, responsive, web-based Employee Salary Management System that enables the HR Manager to manage employee records, execute salary adjustments, and deliver instant analytical answers on organizational compensation.

---

## 2. User Persona

- **Primary Persona:** **HR Manager (Global Total Rewards)**
- **Key Responsibilities:**
  - Oversees compensation planning, performance-based increments, and equity.
  - Audits historical salary trajectories for employee disputes or promotion cycles.
  - Reports departmental budgets and compensation distributions to the CFO and executive leadership.
- **User Needs:**
  - Fast search, filtering, and pagination over 10,000+ employee records.
  - One-click salary adjustment with mandatory reason logging and history tracking.
  - Dynamic analytics dashboard converting multi-currency salaries into a uniform baseline currency.
  - CSV export for offline reporting and legacy archive compliance.

---

## 3. Goals & Success Metrics

| Goal | Target Metric |
| :--- | :--- |
| **High Performance at Scale** | Query and render any slice of 10,000 records in `< 100ms`. |
| **Audit Compliance** | 100% of salary updates captured in an append-only historical log. |
| **Instant Executive Insights** | Real-time organizational KPIs (Total Payroll, Avg Salary, Pay Distribution) in `< 25ms`. |
| **Data Integrity** | Zero data duplication, guaranteed database schema validation, foreign key constraints. |

---

## 4. In-Scope Features

### 4.1 Authentication & Security
- Secure token-based authentication (JWT) with password hashing (`bcrypt`).
- Protected API routes and client-side route guards.

### 4.2 Employee Master Directory
- **Scalable Pagination**: Server-side pagination with configurable page limits (10, 20, 50, 100).
- **Multi-Field Search**: Debounced search querying first name, last name, email, and employee ID.
- **Faceted Filters**: Drill down by Department, Country, Employment Type (Full-time, Part-time, Contract), and Currency.
- **Multi-Column Sorting**: Sort ascending/descending by Name, ID, Department, Salary, Country, Hire Date.
- **Data Export**: Server-side streaming CSV export with current active filters.

### 4.3 Compensation Management & Historical Auditing
- **Employee 360 View**: Detailed profile view showcasing job info, current compensation, and complete salary timeline.
- **Salary Adjustment Flow**: Controlled modal to record salary raises, market adjustments, or promotions with effective dates and mandatory reasoning.
- **CRUD Operations**: Edit biographical details, deactivate/delete employees, and onboard new hires.

### 4.4 Analytics & Intelligence Engine
- **Global Currency Normalization**: Dynamic conversion across 11 global currencies (USD, GBP, EUR, INR, JPY, CAD, AUD, SGD, BRL, MXN, PLN).
- **Executive KPI Cards**: Total active employees, organization-wide monthly payroll, mean salary, and departmental breakdown.
- **Departmental Budget Chart**: Comparison of headcounts and total payroll across all 15 corporate departments.
- **Pay Distribution**: Statistical histogram grouping employee salaries into percentile brackets.
- **Pay Equity & Gender Ratios**: Insights into gender compensation distribution and headcounts.
- **Top Earners Leaderboard**: Instant retrieval of top earners org-wide or filtered by department.

---

## 5. Deliberately Out-of-Scope & Architectural Rationale

To maintain tight architectural focus and deliver a robust, production-quality solution within the assessment timeframe, the following capabilities were deliberately excluded:

| Feature Omitted | Architectural & Product Reasoning |
| :--- | :--- |
| **Automated Bank ACH / Payroll Disbursement** | Direct bank integration requires SWIFT/ACH banking rails, local tax withholdings, and localized compliance. The core problem is **compensation governance and analytics**, not treasury payment execution. |
| **Complex 5-Tier Approval Workflows** | Implementing multi-manager approval matrices adds significant process configuration overhead. For ACME's single HR Manager persona, an immutable audit log (`changed_by`, `effective_date`, `reason`) provides adequate governance without premature workflow engine bloat. |
| **Real-time Live Forex Ticker Streaming** | Financial planning and compensation reports use corporate standard budget exchange rates (e.g., quarterly blended rates) to prevent budget variances caused by intra-day currency volatility. |
| **Employee Self-Service Portal** | ACME's specific requirement is executive HR tooling. Building employee self-service login and payslip downloads diverts engineering effort away from the primary persona (HR Manager). |
| **Document Scanning / OCR of Physical Contracts** | Contract OCR introduces external heavy ML dependencies. Clean manual entry and bulk CSV seeding address the 10,000 employee requirement with deterministic accuracy. |

---

## 6. Technical Stack

- **Backend:** Node.js, Express 5, `better-sqlite3` (SQLite with WAL mode & indexes), `bcryptjs`, `jsonwebtoken`.
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts.
- **Testing:** Jest, Supertest (Backend — 31 tests); Jest, React Testing Library (Frontend — 15 tests).
- **Seeding:** High-performance transactional batch seeding script generating 10,000 realistic employees across 15 departments, 15 countries, and historical salary progressions.
