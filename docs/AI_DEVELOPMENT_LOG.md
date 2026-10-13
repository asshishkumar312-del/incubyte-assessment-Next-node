# AI-Driven Development Log & Prompt History

**Tooling Used:** Google Antigravity Agentic IDE (Pair Programming with LLM Agents)  
**Philosophy:** AI as an Engineering Force Multiplier with Rigorous Human Verification  

---

## 1. Overview of AI Collaboration Workflow

In accordance with Incubyte's assessment guidelines, this project was developed using an agentic AI-driven workflow. Rather than treating AI as a "black box code generator," the development model followed a structured **Think → Specify → Generate → Verify → Refine** cycle:

1. **Specification & Architectural Guardrails:** Defined clear technical constraints (WAL mode, SQLite indexes, React 19 compiler guidelines, normalized schema).
2. **Iterative Generation:** Prompted the agent for focused modules (Schema → Repository → REST API → Tests → Frontend UI).
3. **Engineering Review & Linting:** Actively caught and corrected edge cases, linter warnings (such as React 19 effect cascading renders), and CSS rendering anomalies.
4. **Automated Testing:** Guided the AI to build deterministic test suites for both backend and frontend layers.

---

## 2. Prompts & Instruction Log

### Phase 1: Architecture & Database Design
> **Prompt:**
> *"Design a normalized SQLite database schema for an Employee Salary Management system with 10,000 employees across 15 countries. We need an immutable audit history of all salary revisions, support for 11 global currencies, and role-based access for an HR Manager. Provide SQL schemas with high-performance indexes."*
>
> **Human Review & Refinement:**
> - Ensured salary modifications never overwrite records; implemented the append-only `salaries` ledger with `(employee_id, effective_date)` composite indexes.
> - Mandated `better-sqlite3` and enabled `PRAGMA journal_mode = WAL` for non-blocking concurrent reads.

---

### Phase 2: Transactional Seeding at Scale (10,000 Records)
> **Prompt:**
> *"Write a Node.js seed script to populate 10,000 realistic employees across 15 departments, 15 countries, and historical salary progressions. It must run in under 3 seconds without choking memory or disk I/O."*
>
> **Human Review & Refinement:**
> - Initial implementation used individual inserts which took 35+ seconds. Refactored into a single atomic `db.transaction()` block, bringing execution time down to 2.4 seconds.
> - Added realistic salary bands per country (e.g. INR in Lakhs, JPY in Millions, USD/EUR in standard ranges) to ensure realistic analytics.

---

### Phase 3: Analytics Engine & Currency Aggregation
> **Prompt:**
> *"Create Express repository queries to answer key executive compensation questions: total payroll, average salary converted to any selected baseline currency, departmental breakdown, gender distribution, and statistical pay brackets. Ensure calculations are performed in SQL rather than loading 10,000 rows into Node.js memory."*
>
> **Human Review & Refinement:**
> - Verified that all aggregations join `exchange_rates` within the SQL engine:
>   `SUM(s.amount * er.rate_to_usd / target_rate.rate_to_usd)`
> - Ensured query latency stays below 10ms for all analytics queries.

---

### Phase 4: Frontend Development & Resolving React 19 Cascading Renders
> **Prompt & Context:**
> *"The React 19 compiler flagged an error in EmployeeTable: 'Error: Calling setState synchronously within an effect can trigger cascading renders'. Explain the root cause and refactor the component to follow modern React best practices."*
>
> **Human Review & Refinement:**
> - Identified that calling `fetchEmployees` (which started with `setLoading(true)`) synchronously inside `useEffect` forced an immediate re-render after commit.
> - Fixed by initializing state with `loading = true`, moving data fetching directly into `useEffect` with an `ignore` cleanup flag, and isolating manual refreshes to user event handlers.
> - When the user flagged that `"Full-time"` badge wrapped across hyphens, added `whitespace-nowrap inline-block` and pointer cursor utilities across table actions.

---

### Phase 5: Test Generation (Frontend & Backend)
> **Prompt:**
> *"Write comprehensive Jest test suites for both backend and frontend. For the backend, test auth, pagination, search, salary incrementing, and analytics in Supertest. For the frontend, test the EmployeeTable with loading states, badge formatting, action callbacks, and AuthContext."*
>
> **Outcome:**
> - **Backend:** 3 test suites, 31 tests passing in 25s.
> - **Frontend:** 3 test suites, 15 tests passing in 113s.

---

## 3. Key Takeaways & AI Engineering Craftsmanship

- **Prompt Specificity Yields Better Architecture:** Giving the model clear constraints (such as append-only ledger pattern and sub-10ms latency targets) produced production-grade code on the first attempt.
- **Verification Over Blind Trust:** Static analysis, linting, and automated test runners were used to validate all generated code.
- **Speed to Quality:** The combination of AI scaffolding and human engineering judgment delivered a full-stack, tested system with 10,000 seeded employees and real-time analytics in a single day.
