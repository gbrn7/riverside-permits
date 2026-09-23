# Riverside Council — Community Hall Permit Register

> **Municipal Facility Reservation & Permit Licensing Engine**  
> Built strictly based on [`artifacts/1d-technical-document.md`](artifacts/1d-technical-document.md) and [`ASSUMPTIONS.md`](ASSUMPTIONS.md).

---

## 1. System Overview & Technology Stack

The Permit Register handles municipal facility reservations, statutory fee calculations, and operational permit lifecycle management for Riverside Council.

- **Backend:** Java 21 (LTS), Spring Boot 4.1.1, Spring Data JPA, Hibernate, Bean Validation, H2 In-Memory DB (`jdbc:h2:mem:permitdb`).
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Containerization:** Multi-stage Dockerfiles + Docker Compose (Nginx reverse proxy for frontend, Temurin JRE runtime for backend).

---

## 2. Quickstart with Docker Compose

To spin up the entire full-stack application (Backend on `8080`, Frontend on `3000`):

```bash
# Build and run containers
docker compose up --build

# Or run in detached background mode
docker compose up --build -d
```

### Access URLs:
- **Staff Portal (Frontend):** [http://localhost:3000](http://localhost:3000)
- **REST API (Backend):** [http://localhost:8080/api/permits](http://localhost:8080/api/permits)
- **H2 Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)  
  - *JDBC URL:* `jdbc:h2:mem:permitdb`
  - *Username:* `sa`
  - *Password:* *(blank)*

*(Note for WSL 2 users: Ensure Docker Desktop is running and WSL 2 integration is enabled under Docker Desktop Settings $\rightarrow$ Resources $\rightarrow$ WSL Integration).*

---

## 3. Running Locally (Without Docker)

### Prerequisites:
- Java 21+ (`java -version`)
- Node.js 20+ (`node -v`)

### Step 1: Start the Spring Boot Backend
```bash
cd backend
./mvnw spring-boot:run
```
The API starts on `http://localhost:8080`. Reference data and 9 initial permits are automatically seeded.

### Step 2: Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
The client starts on `http://localhost:5173` and automatically proxies `/api/*` requests to `http://localhost:8080`.

---

## 4. Test Suite Execution

Run the backend unit and integration test suite (asserting all 18 functional requirements and business rules):
```bash
cd backend
./mvnw test
```
**Results:** 19/19 tests passing (`FeeCalculatorTest`, `PermitEligibilityValidatorTest`, `PermitControllerIntegrationTest`).

Run the frontend TypeScript & production build check:
```bash
cd frontend
npm run build
```

---

## 5. Seeded Test Data & Verification Scenarios

The system is pre-seeded with realistic scenarios demonstrating the core business rules:

| Permit Number | Holder | Hall | Status | End Date | Test Scenario & Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `P-2026-0001` | Sarah Jenkins | Riverside Community Hall | `ACTIVE` | 2026-06-14 | **Standard Renewal (Cap Test):** Renew past 30 days to observe 30-day statutory cap fee (£3,600 max). |
| `P-2026-0002` | Riverside Youth Club | Eastgate Hall | `ACTIVE` | 2026-07-01 | **Council Use Booking:** Exempt from fees (£0.00) and remains `ACTIVE` post-renewal without billing. |
| `P-2026-0003` | Marcus Vance | Northbrook Pavilion | `EXPIRED` | 2025-05-15 | **Expired > 90 Days:** System rejects renewal with `409 Conflict (EXPIRED_TOO_LONG)`. |
| `P-2026-0005` | Liam Davies | Riverside Community Hall | `AWAITING_PAYMENT` | 2026-08-01 | **Ineligible Status:** Renewal disabled; rejects with `409 Conflict (WRONG_STATUS)`. |
| `P-2026-0011` | Modern Dance Academy | Eastgate Hall | `EXPIRED` | *Dynamic (45 days ago)* | **Lapsed Renewal (Grace Period):** Lapsed within 90 days; renewal is permitted. |

---

## 6. Deliverables & Documentation Index

- [`artifacts/1a-business-flowchart.md`](artifacts/1a-business-flowchart.md) — Non-technical council officer workflow.
- [`artifacts/1b-technical-flowchart.md`](artifacts/1b-technical-flowchart.md) — Engineering component and sequence flow.
- [`artifacts/1c-functional-document.md`](artifacts/1c-functional-document.md) — Client contract & Requirements Traceability Matrix (FR-01 to FR-18).
- [`artifacts/1d-technical-document.md`](artifacts/1d-technical-document.md) — Indispensable technical specification (Schemas, APIs, BR-1 to BR-10).
- [`ASSUMPTIONS.md`](ASSUMPTIONS.md) — 11 documented conflicts, decisions, financial formulas, and escalation routes.
- [`AGENTS.md`](AGENTS.md) — Agent steering rules, anti-hallucination guardrails, and human conductor protocol.
- [`DECISIONS.md`](DECISIONS.md) — Architectural tradeoffs, Claude vs Gemini evaluation, and AI pairing protocols.
