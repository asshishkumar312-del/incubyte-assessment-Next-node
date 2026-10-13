# Architecture & Product Trade-Offs

This document outlines the key technical and product trade-offs evaluated during the design and implementation of the ACME Employee Salary Management System.

---

## 1. Database Selection: Embedded SQLite vs Client-Server PostgreSQL

| Option | Pros | Cons | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **SQLite with `better-sqlite3`** | • In-process execution with zero network latency (`< 1ms` query latency).<br>• Zero external Docker/cloud dependencies.<br>• WAL mode allows concurrent non-blocking reads.<br>• Extremely lightweight and portable for assessment review. | • Single-writer concurrency lock.<br>• Limited distributed clustering. | **Selected.** For 10,000 employees and an internal HR Manager tool, in-process SQLite outperforms client-server PostgreSQL in query latency while simplifying deployment and testing. |
| **PostgreSQL** | • Unlimited concurrent writers.<br>• Advanced window functions and connection pooling. | • Requires external database server, network roundtrips, and Docker orchestration.<br>• Overhead of connection pool management. | **Deferred.** Unnecessary operational complexity for a single-tenant HR manager system. |

---

## 2. Salary Data Modeling: Immutable Ledger vs Mutating Current Salary

| Option | Pros | Cons | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **Append-Only Ledger (`salaries` table)** | • Full historical audit trail (when, why, how much, and by whom).<br>• Compliance and dispute resolution.<br>• Enables salary trajectory charts over time. | • Requires subquery or window function to resolve latest salary. | **Selected.** In HR and payroll, data mutation without an audit trail is unacceptable. The slight query overhead is eliminated with composite indices `(employee_id, effective_date)`. |
| **Flat Table (`employees.current_salary`)** | • Direct single-table select queries without joins. | • Overwriting previous salaries permanently destroys salary history and auditing. | **Rejected.** Fails the requirement of answering how people's compensation has evolved over time. |

---

## 3. Currency Conversion: In-Database Exchange Rates vs Live FX API

| Option | Pros | Cons | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **Relational `exchange_rates` Table** | • Sub-5ms deterministic analytics computations.<br>• No third-party network failures, API rate limits, or latency spikes.<br>• Reflects standard corporate budget exchange rates. | • Rates must be periodically refreshed via administrative trigger. | **Selected.** Corporate finance teams use fixed quarterly budget exchange rates for compensation analytics to avoid volatile intra-day currency shifts. |
| **Real-Time Live FX API** | • Up-to-the-second market exchange rates. | • Third-party API points of failure, latency overhead (200-500ms), and rate limiting. | **Rejected.** Volatile exchange rates cause budget totals to fluctuate confusingly between page refreshes. |

---

## 4. Search Implementation: Indexed Composite SQL vs External Search Cluster

| Option | Pros | Cons | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **Indexed Parameterized SQL** | • Native database execution with zero extra infrastructure.<br>• Exact prefix matching across First Name, Last Name, and Employee ID.<br>• Execution time: `< 8ms` over 10,000 rows. | • Limited fuzzy typo tolerance compared to Lucene/Elastic. | **Selected.** For 10,000 structured employee records, indexed SQL queries execute in under 10ms with zero memory overhead or indexing sync lag. |
| **Elasticsearch / Meilisearch** | • Typo tolerance and advanced fuzzy scoring. | • Requires separate service daemon, RAM footprint (>1GB), and eventual consistency sync. | **Rejected.** Massive over-engineering for a 10,000 row corporate directory. |

---

## 5. Frontend Data Strategy: Client-Side Virtualization vs Server Pagination

| Option | Pros | Cons | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **Server-Side Pagination & Filtering** | • Payload size per request is minimal (`< 25KB`).<br>• Initial page load is instantaneous.<br>• Scales gracefully to 100,000+ employees. | • Filter changes require a lightweight API roundtrip (`< 15ms`). | **Selected.** Downloading 10,000 employee records to the browser client would consume megabytes of RAM and slow initial mobile/desktop load times. Server pagination is standard enterprise practice. |
| **Download All 10,000 Rows to Client** | • Instant zero-latency client sorting and filtering once loaded. | • 5MB–10MB initial payload download, blocking mobile browsers and causing severe UI thread pauses. | **Rejected.** Poor user experience and does not scale. |

---

## 6. Frontend Server-State Management: TanStack Query vs Manual `useEffect`

| Option | Pros | Cons | Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **TanStack Query v5 (`useQuery`)** | • Fetches run outside the React render-commit cycle — zero cascading render warnings.<br>• Automatic 2-minute `staleTime` cache: instant navigation between Dashboard and Analytics.<br>• Built-in request deduplication, background refetch, and `isFetching` flag.<br>• `refetch()` replaces manual `retryCount` state.<br>• Race conditions handled internally (no `ignore` flag needed in pages). | • Adds `@tanstack/react-query` as a dependency.<br>• Requires a `QueryProvider` wrapper in the layout. | **Selected.** For a multi-page app where the same currency-keyed analytics data is consumed by both Dashboard and Analytics pages, a shared query cache with deduplication provides significant UX and maintainability gains. |
| **Manual `useEffect` + `useState`** | • Zero additional dependencies.<br>• Familiar to all React developers. | • Synchronous `setState` inside `useEffect` triggers React 19 cascading render warnings.<br>• No caching — re-fetches identically keyed data on every mount.<br>• Manual race condition handling with `ignore = true` cleanup.<br>• Manual retry counter state required for refresh UX. | **Replaced.** The manual approach requires boilerplate and workarounds to solve problems that React Query solves by design. |
