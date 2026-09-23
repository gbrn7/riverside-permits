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

## 2. Running with Docker or Podman

The entire stack is containerized with standard OCI multi-stage images. You can run it using either **Docker** or **Podman**.

### Option A: Running with Docker

```bash
# Build and run containers
docker compose up --build

# Or run in background (detached)
docker compose up --build -d

# To shut down:
docker compose down
```

*(WSL 2 note: Ensure Docker Desktop is running on Windows with WSL 2 integration enabled under Docker Desktop Settings → Resources → WSL Integration).*

---

### Option B: Running with Podman

#### 1. Using Podman Compose:
```bash
# Using Podman's built-in compose provider:
podman compose up --build

# Or with python podman-compose:
podman-compose up --build

# To shut down:
podman compose down
```

#### 2. Using Pure Podman CLI (Without Compose):
```bash
# 1. Create container network
podman network create riverside-permit-network

# 2. Build and launch Backend container
podman build -t riverside-permit-backend ./backend
podman run -d \
  --name riverside-permit-backend \
  --network riverside-permit-network \
  -p 8080:8080 \
  riverside-permit-backend

# 3. Build and launch Frontend container (Nginx reverse proxy)
podman build -t riverside-permit-frontend ./frontend
podman run -d \
  --name riverside-permit-frontend \
  --network riverside-permit-network \
  -p 3000:80 \
  riverside-permit-frontend

# To stop and remove:
podman stop riverside-permit-frontend riverside-permit-backend
podman rm riverside-permit-frontend riverside-permit-backend
```

*(Podman installation for Ubuntu/WSL: `sudo apt-get update && sudo apt-get install -y podman podman-compose`, or enable WSL integration in Podman Desktop).*

---

### Access URLs & Credentials:
- **Staff Portal (Frontend):** [http://localhost:3000](http://localhost:3000)
- **REST API (Backend):** [http://localhost:8080/api/permits](http://localhost:8080/api/permits)
- **H2 Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)  
  - *JDBC URL:* `jdbc:h2:mem:permitdb`
  - *Username:* `sa`
  - *Password:* *(blank)*

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

Run the backend unit and integration test suite (asserting all 24 functional requirements, domain rules, and withdrawal journeys):
```bash
cd backend
./mvnw test
```
**Results:** **24/24 tests passing** (`FeeCalculatorTest`, `PermitEligibilityValidatorTest`, `PermitControllerIntegrationTest`, `PermitWithdrawalIntegrationTest`).

Run the frontend TypeScript & production build check:
```bash
cd frontend
npm run build
```

---

## 5. Automated AI Agent Pipeline & Verification Suite (Part 4)

The project includes an autonomous AI agent pipeline and dual-gate verification engine in [`pipeline/`](pipeline) that transforms raw requirements into downstream artifacts (`artifacts/rc4/`), generates code, and validates them against anti-invention and anti-drop guardrails before human review.

### Running the Pipeline:

```bash
# 1. Run complete end-to-end reconciliation, artifact generation, code generation, and verification:
python3 pipeline/run_pipeline.py --story=RC-4

# 2. Run the verification gates only (checks schema whitelist, RTM coverage, and tests):
python3 pipeline/run_pipeline.py --story=RC-4 --verify-only

# 3. Prove Anti-Invention Gate (Simulates unapproved refund tables/endpoints; halts build with code 1):
python3 pipeline/run_pipeline.py --story=RC-4 --simulate-invention --verify-only

# 4. Prove Anti-Drop Gate (Simulates dropped acceptance criteria; halts build with code 1):
python3 pipeline/run_pipeline.py --story=RC-4 --simulate-drop --verify-only
```

The generated verification report is recorded at [`artifacts/rc4/VERIFICATION_REPORT.md`](artifacts/rc4/VERIFICATION_REPORT.md).

---

## 6. Seeded Test Data & Verification Scenarios

The system is pre-seeded with realistic scenarios demonstrating the core business rules:

| Permit Number | Holder | Hall | Status | End Date | Test Scenario & Business Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `P-2026-0001` | Sarah Jenkins | Riverside Community Hall | `ACTIVE` | 2026-06-14 | **Standard Renewal (Cap Test):** Renew past 30 days to observe 30-day statutory cap fee (£3,600 max). |
| `P-2026-0002` | Riverside Youth Club | Eastgate Hall | `ACTIVE` | 2026-07-01 | **Council Use Booking:** Exempt from fees (£0.00) and remains `ACTIVE` post-renewal without billing. |
| `P-2026-0003` | Marcus Vance | Northbrook Pavilion | `EXPIRED` | 2025-05-15 | **Expired > 90 Days:** System rejects renewal with `409 Conflict (EXPIRED_TOO_LONG)`. |
| `P-2026-0005` | Liam Davies | Riverside Community Hall | `AWAITING_PAYMENT` | 2026-08-01 | **Ineligible Status:** Renewal disabled; rejects with `409 Conflict (WRONG_STATUS)`. |
| `P-2026-0011` | Modern Dance Academy | Eastgate Hall | `EXPIRED` | *Dynamic (45 days ago)* | **Lapsed Renewal (Grace Period):** Lapsed within 90 days; renewal is permitted. |

---

## 7. Deliverables & Documentation Index

- [`artifacts/1a-business-flowchart.md`](artifacts/1a-business-flowchart.md) — Non-technical council officer workflow (Part 1).
- [`artifacts/1b-technical-flowchart.md`](artifacts/1b-technical-flowchart.md) — Engineering component and sequence flow (Part 1).
- [`artifacts/1c-functional-document.md`](artifacts/1c-functional-document.md) — Client contract & Requirements Traceability Matrix (FR-01 to FR-18).
- [`artifacts/1d-technical-document.md`](artifacts/1d-technical-document.md) — Indispensable technical specification (Schemas, APIs, BR-1 to BR-10).
- [`ASSUMPTIONS.md`](ASSUMPTIONS.md) — 11 documented conflicts, decisions, financial formulas, and escalation routes (Part 3).
- [`artifacts/rc4/`](artifacts/rc4/) — AI-generated artifacts (`1a`, `1b`, `1c`, `1d`) and [`VERIFICATION_REPORT.md`](artifacts/rc4/VERIFICATION_REPORT.md) (Part 4).
- [`pipeline/`](pipeline/) — Reconciler, generator, and dual-gate verifier engine (Part 4).
- [`AGENTS.md`](AGENTS.md) — Agent steering rules, anti-hallucination guardrails, and human conductor protocol.
- [`DECISIONS.md`](DECISIONS.md) — Architectural tradeoffs, Claude vs Gemini evaluation, and AI pairing protocols.
