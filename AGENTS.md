# AGENTS.md — Riverside Council Permit Register Engine

> **Operational Guidelines, Architectural Constraints, and Steering Rules for AI Agents**
> **Repository:** `riverside-council/mgg`
> **Domain:** Public-Sector Permit & Licensing Management

---

## 1. Prime Directive & Chain of Custody

You are an AI software engineering agent working on Riverside Council's Community Hall Permit Register. This system handles municipal revenue, public facility reservations, and statutory compliance. Precision is non-negotiable.

### The 6-Stage Artifact Chain
Every feature and user journey in this system progresses strictly through this pipeline:
```
[Raw Requirements / Clarifications]
               │
               ▼
   [1a. Business Flowchart]      (Audience: Non-technical council officers)
               │
               ▼
   [1b. Technical Flowchart]     (Audience: System architects & backend engineers)
               │
               ▼
   [1c. Functional Document]     (Audience: Client sign-off & BA stakeholders)
               │
               ▼
   [1d. Technical Document]      (Audience: Implementation engineers & AI agents)
               │
               ▼
          [2. Code]              (React Frontend + Spring Boot REST API)
```

### The Golden Build Rule
> **Build exclusively from `artifacts/1d-technical-document.md`, NEVER directly from raw requirements.**
- If a requirement or rule is absent from `1d-technical-document.md`, **do not write code for it**.
- If you find an ambiguity, conflict, or gap during implementation, **stop and escalate** or update `ASSUMPTIONS.md` and `1d` before implementing.
- Never silently invent or assume business rules in code.

---

## 2. Core Architectural & Domain Rules

### 2.1 Technology Stack
- **Backend:** Java 17+, Spring Boot 3.x, Spring Data JPA, Hibernate, Bean Validation, H2/PostgreSQL.
- **Frontend:** React 18+, Vite / TypeScript, Tailwind CSS / modern component architecture.
- **API Style:** RESTful JSON over HTTP, standard error structures (`error`, `message`, `timestamp`).

### 2.2 Domain Entities & Data Model (`artifacts/1d-technical-document.md#1`)
- **`halls`**: id, name, district, daily_rate (`DECIMAL(10,2)`), created_at.
- **`purposes`**: id, name, is_council_use (`BOOLEAN`), created_at.
- **`permits`**: id, permit_number (`VARCHAR(20)`), holder_name (`VARCHAR(200)`), hall_id (`FK`), purpose_id (`FK`), status (`ENUM`), start_date (`DATE`), end_date (`DATE`), fee (`DECIMAL(10,2)`), created_at, updated_at.
- **`renewal_records`**: id, permit_id (`FK`), previous_end_date (`DATE`), new_end_date (`DATE`), fee (`DECIMAL(10,2)`), performed_by (`VARCHAR(200)`), performed_at (`TIMESTAMP`).
- **`permit_history`**: id, permit_id (`FK`), action (`VARCHAR(50)`), detail (`TEXT`), performed_by (`VARCHAR(200)`), performed_at (`TIMESTAMP`).

### 2.3 Strict Business Rules (Must Enforce)
1. **Human-Readable Labels Only (No Codes):**
   - The UI and API list/detail responses **must never display raw codes** (e.g., `RH-02`, numeric IDs). Always resolve full descriptive names: `hallName` (e.g., "Riverside Community Hall") and `purposeName` (e.g., "Community Event").
2. **Renewal Eligibility (BR-1 & BR-2):**
   - Permits in `ACTIVE` status can always be renewed.
   - Permits in `EXPIRED` status can **only** be renewed if expired **within 90 calendar days** (`ChronoUnit.DAYS.between(permit.getEndDate(), LocalDate.now()) <= 90`).
   - Permits in `DRAFT`, `AWAITING_PAYMENT`, or `WITHDRAWN` **cannot** be renewed (return `409 WRONG_STATUS`).
3. **Date Validation (BR-3):**
   - `newEndDate` must be **strictly after** the permit's current `endDate`. Otherwise return `400 INVALID_END_DATE`.
4. **Fee Calculation & 30-Day Statutory Cap (BR-4):**
   - `daysAdded = ChronoUnit.DAYS.between(currentEndDate, newEndDate)`.
   - `cappedDays = Math.min(daysAdded, 30)`.
   - If `purpose.is_council_use == true`: **Fee is £0.00** (exempt).
   - Otherwise: `fee = cappedDays * hall.daily_rate` (rounded `HALF_UP` to 2 decimal places).
5. **Post-Renewal Status Transition (BR-5):**
   - If `purpose.is_council_use == true`: status remains **`ACTIVE`** (no billing needed).
   - If `purpose.is_council_use == false`: status transitions to **`AWAITING_PAYMENT`**.
6. **Transactional Integrity (BR-9):**
   - Renewal commit **must** be an atomic transaction:
     1. Insert into `renewal_records`.
     2. Update `permits` (`end_date`, `status`, `updated_at`).
     3. Insert into `permit_history` (`action = 'RENEWED'`).
   - If any step fails, roll back completely.
7. **Search / List Queries (BR-6 & BR-8):**
   - Default sort order: **`start_date ASC`** (soonest first), tie-breaker `created_at DESC`.
   - Pagination: default `page = 0`, `size = 10`.
   - Empty search results return HTTP **`200 OK`** with `content: []`, `totalElements: 0`. **Never return 404.**
8. **Audit Trail Placeholders (BR-10):**
   - Populate `performed_by` with literal `'system'` until the auth service is integrated.

---

## 3. Anti-Hallucination & Anti-Drift Guardrails

AI agents working in this repository are prone to two critical failure modes. Every agent must adhere to the following guardrails:

### Guardrail A: Zero Unauthorized Additions (Anti-Invention)
- **Do not invent database columns or tables** not documented in `artifacts/1d-technical-document.md`.
- **Do not create phantom endpoints** (e.g., payment capture, online refund APIs, auto-expiry cron jobs) that were explicitly marked out of scope.
- **Do not apply arbitrary default values** when requirements conflict. Escalate the contradiction.

### Guardrail B: Zero Silent Requirement Drops (Anti-Drop)
- Every requirement in `artifacts/1c-functional-document.md` (FR-01 through FR-18) must be tracked in the code.
- **Mandatory Requirements Traceability Tagging:**
  - When implementing or testing a rule, tag the class, method, or test with `@Requirement("FR-XX", "BR-YY")`.
  - Example:
    ```java
    // Requirement: FR-14 (Fee Cap), BR-4
    @Test
    void shouldCapRenewalFeeAtThirtyDays() { ... }
    ```
- Any PR or generated commit that omits a test case for an edge case (e.g., Council Use £0, 91st day expired rejection) will be rejected by verification checks.

---

## 4. Verification & Testing Workflow

Before committing any generated code or marking a task complete:

1. **Unit & Slice Tests:**
   - Verify all domain business rules via isolated JUnit 5 / AssertJ tests (`FeeCalculatorTest`, `PermitEligibilityTest`, `PermitRenewalServiceTest`).
2. **Web Layer Integration Tests:**
   - Use `MockMvc` or `WebMvcTest` to verify HTTP status codes:
     - `400 BAD_REQUEST` for invalid dates or malformed payloads.
     - `404 NOT_FOUND` for non-existent permit ID.
     - `409 CONFLICT` for ineligible statuses (`AWAITING_PAYMENT`, `WITHDRAWN`, expired > 90 days).
     - `200 OK` for valid operations and empty search results.
3. **Frontend Contract Validation:**
   - Ensure the React client handles error payloads gracefully, preserving search state on back navigation (`RC-2 AC-3`).

---

## 5. Decision Escalation Protocol

If you encounter an ambiguity or contradiction while implementing:
1. **Stop execution.** Do not silently pick a path.
2. Check `artifacts/1d-technical-document.md#6-open-assumptions` and `ASSUMPTIONS.md`.
3. If unaddressed, document:
   - Source conflict (e.g., `stories.md` says X, `clarifications.md` says Y).
   - Financial & operational impact.
   - Recommended assumption based on council policy precedence.
4. Record the decision in `DECISIONS.md` and `ASSUMPTIONS.md`.

---

## 6. AI Orchestration Transparency & DECISIONS.md Accountability

AI agents operating in this repository must maintain complete transparency regarding how AI is orchestrated and steered. All agents must ensure that `DECISIONS.md` explicitly documents:

1. **Human-in-the-Loop Conductor Model:**
   - The human engineer acts as the lead system architect, domain referee, and quality gatekeeper. AI is never given unmonitored authority over business, revenue, or statutory compliance rules.
2. **Multi-Model Orchestration Strategy:**
   - How multiple complementary models (e.g., Claude for policy nuance and functional documentation; Gemini for technical data contracts, precision date-math, and CLI execution) are combined to cross-evaluate assumptions and eliminate single-model blind spots.
3. **Active Steering, Arguing & Course Corrections:**
   - Documenting concrete instances where the human engineer challenged the AI's default behavior (e.g., rejecting generic e-commerce patterns in favor of council grace periods, enforcing the 30-day fee cap, and preventing hardcoded hall lists).
4. **Adversarial Verification Architecture:**
   - Separating generation from evaluation by deploying a Generator Agent (building from `1d`) alongside a Critic / Verifier Agent (validating strictly against `1c` functional acceptance criteria).
