# DECISIONS.md — Engineering & AI Architecture Rationale

> **Project:** Riverside Council — Community Hall Permit Register  
> **Evaluation Reference:** Engineer (Full-Stack, AI-Assisted) Build Test  
> **Author:** Candidate  
> **Date:** September 2026  

---

## Executive Summary

Building software from municipal public-sector requirements is fundamentally an exercise in **reconciliation and traceability**, not rapid code typing. In this project, raw inputs from four stakeholders directly contradicted each other: signed BA user stories specified one set of rules, while post-signoff communications from Finance and Hall Operations introduced statutory fee caps, grace periods for lapsed permits, and mandatory display overrides.

This document details the architectural decisions, scope tradeoffs, artifact evaluations, and formal quality controls implemented across the journey chain.

---

## 1. What We Built, Deliberately Skipped, and Why

### 1.1 What We Built
We focused on delivering a robust, end-to-end slice covering journeys **RC-1, RC-2, and RC-3**:

1. **RC-1: Permit Register & Search Engine**
   - **Multi-parameter filtering:** Permits can be filtered by permit number, partial/case-insensitive holder name, hall, purpose, status, and date range.
   - **Operational Default Sorting:** Sorted by `start_date ASC` (soonest first), with tie-breaking on `created_at DESC`. This directly honors Operations Manager Jonathan Wee’s clarification over the outdated "newest first" story requirement.
   - **Human-Readable Projection:** Displays full hall and purpose names (e.g., "Riverside Community Hall") rather than internal system codes (e.g., `RH-02`).
   - **Safe Empty States:** Zero-result queries return HTTP `200 OK` with an empty collection (`[]`), never an HTTP `404`.

2. **RC-2: Read-Only Permit View**
   - Complete permit inspection view showing primary metadata, financial breakdown, chronological renewal logs, and state transition history.
   - Immutable presentation preventing accidental inline mutations.
   - Preserves search filters and pagination state upon navigating back to the register.

3. **RC-3: Renewal Engine & Two-Step Commitment Flow**
   - **Validation & Eligibility:** Permits must be `ACTIVE`, or `EXPIRED` within the 90-calendar-day grace period. Permits in `DRAFT`, `AWAITING_PAYMENT`, or `WITHDRAWN` statuses are rejected with HTTP `409 Conflict`.
   - **Statutory Pricing Logic:** Calculates fee as `min(daysAdded, 30) * hall.dailyRate`. Automatically applies a 100% waiver (£0.00) for "Council Use" bookings.
   - **Two-Step Confirmation:** A dedicated preview endpoint computes and displays the exact invoiceable fee before any database state mutation occurs.
   - **Atomic State Transitions:** In a single database transaction, the system creates the renewal log, updates the permit's end date and status (`ACTIVE` if Council Use, `AWAITING_PAYMENT` otherwise), and writes an audit log entry.

4. **Dynamic Reference Data**
   - Seed data and relational schemas for `halls` and `purposes` rather than hardcoded enums, ensuring support for Q4 facility expansions (e.g., Westfield Hall).

---

### 1.2 What We Deliberately Skipped and Why

| Feature / Component | Stakeholder Request | Rationale for Skipping |
|:---|:---|:---|
| **Payment Gateway & Checkout UI** | Implied in initial stories | **Explicitly Out of Scope:** BA clarification (28 May) confirmed payments are processed by an external finance system. The permit moves to `AWAITING_PAYMENT` and hands off. Building payment processing would be an unrequested invention. |
| **Authentication & Fine-Grained RBAC** | Hall Supervisor (Sarah Lim) | Audit attribution currently writes `'system'` as a placeholder (`BR-10`). Standing up an OAuth2/OIDC identity provider within a 6-hour test consumes excessive time without adding domain value. |
| **Excel / CSV Export** | Jonathan Wee (Chat 19 May) | Explicitly deferred by the BA ("probably not this release"). Implementing this would violate scope discipline. |
| **Print-Optimized Layouts** | Sarah Lim (Email 22 May) | Categorized by Sarah herself as peripheral ("Not your problem I think"). Pure presentation polish with low architectural leverage. |
| **RC-4 (Withdraw Permit) Implementation** | Stories RC-4 | **Deliberately reserved for Part 4:** The brief specifically mandates that RC-4 be used to test the automated AI generator and validation checks. |

---

## 2. Artifact Chain Evaluation: What Earned Its Keep vs. What to Cut

The build test evaluates the 6-stage chain:
$$\text{Requirements} \longrightarrow \text{1a (Business Flowchart)} \longrightarrow \text{1b (Technical Flowchart)} \longrightarrow \text{1c (Functional Doc)} \longrightarrow \text{1d (Technical Doc)} \longrightarrow \text{Code}$$

### 2.1 Artifact Value Assessment

* **1a. Business Flowchart (Non-Technical): EARNED ITS KEEP**
  - *Why:* Council officers and department heads cannot parse SQL schemas or OpenAPI specs. Having a visual, jargon-free document that accurately reflects their day-to-day workflow (screens, phone conversations with customers, clear decision diamonds) is critical for commercial sign-off.
  - *Keep as-is.*

* **1b. Technical Flowchart (Engineering): CANDIDATE TO CUT / MERGE**
  - *Why:* In practice, maintaining a separate technical flowchart creates documentation synchronization lag. The technical flowchart essentially duplicates what is better communicated through a sequence diagram inside the Technical Document (1d) and an OpenAPI specification.
  - *Recommendation:* **Cut as a standalone artifact.** Fold essential sequence diagrams and state-machine transitions directly into **1d (Technical Document)**.

* **1c. Functional Document (Client Contract): EARNED ITS KEEP**
  - *Why:* This is the binding agreement between client and engineering. It captures the **Requirements Traceability Matrix (RTM)**, lists deviations from original user stories, and explicitly defines what is out of scope. Without 1c, scope creep cannot be contractually defended.
  - *Keep as-is.*

* **1d. Technical Document (Build Specification): THE INDISPENSABLE CORE**
  - *Why:* This is the single source of truth for implementation. It defines tables, strict data types, HTTP status codes, error payloads, and atomic boundaries. If an AI agent or engineer builds only from this document, the software works.
  - *Keep as-is.*

---

## 3. Where Our Documents Were Incomplete or Wrong Once Coding Began

Even with rigorous upfront documentation, implementing the slice surfaced concrete edge cases and gaps in our own specifications:

1. **Daily Rate Inference Gap:**
   - *Issue:* `stories.md` referenced hall daily rates but never explicitly listed them. We had to reverse-engineer them from sample permits (Riverside = £120/day, Eastgate = £95/day, Northbrook = £80/day, Southbank = £150/day).
   - *Doc Correction:* Formally documented in `1d` Seed Data and flagged as a high-risk assumption requiring Finance confirmation.

2. **Date Duration Math Ambiguity:**
   - *Issue:* In `1c`, renewal fee was defined as "number of days added multiplied by daily rate". In Java, `ChronoUnit.DAYS.between(2026-06-14, 2026-06-15)` returns `1`. If an officer enters the same date, it returns `0`. Does a 1-day extension mean staying until the 15th (1 day) or inclusive?
   - *Resolution:* Enforced strictly in `1d` rule `BR-3`: `newEndDate.isAfter(currentEndDate)`. Same-day renewals are rejected with `400 INVALID_END_DATE`.

3. **Expired Permit Lapsed Duration Calculation:**
   - *Issue:* When renewing an expired permit within the 90-day grace period, what is the extension baseline? Does the renewal fee calculate from the *old expired end date* or from *today's date*?
   - *Resolution:* Calculating from `permit.endDate` honors the contract continuity. However, if a permit expired 45 days ago and is renewed for 50 days from the old date, the customer only gets 5 days of actual future use despite paying for 30 capped days. This is an operational trap that was not specified in any BA document. We documented this as open assumption `§3.J`.

4. **Frontend Filter Retention Mechanism:**
   - *Issue:* Requirement `RC-2 AC-3` states the officer must return to the register with filters intact. 1d did not initially specify whether this state should be stored in browser `sessionStorage`, client memory, or URL query parameters.
   - *Resolution:* Standardized on URL search params (`?status=ACTIVE&hallId=1&page=0`) to allow bookmarking and natural browser history navigation.

---

## 4. How to Stop an AI Agent From Inventing Things and Silently Dropping Requirements

> *This is the critical operational challenge: AI agents are fast, plausible, and confidently wrong.*

Standard prompt engineering ("be careful", "do not hallucinate") is insufficient for production systems handling real money and legal compliance. We implement **deterministic, multi-layer verification systems**:

```
                       ┌─────────────────────────────────────┐
                       │  1c / 1d Formal Specifications      │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    AI Code & Artifact Generation      │
                      └───────────────────┬───────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [ANTI-INVENTION CHECK]                             [ANTI-DROP CHECK]
  AST & Contract Diff Validator                     Bidirectional RTM Linter
  - DDL schema whitelist                            - Parses FR-01..18 tags
  - OpenAPI endpoint whitelist                      - Verifies 100% test coverage
  - Rejects undeclared tables/cols                  - Fails build if AC test missing
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                        ┌───────────────────────────────────┐
                        │   Adversarial Critic Agent Test   │
                        │   (Black-Box Acceptance Suite)    │
                        └─────────────────┬─────────────────┘
                                          │ PASS / FAIL Gate
                                          ▼
```

### 4.1 Stopping Inventions (Fabricated Columns, Endpoints, and Rules)
1. **Strict Contract Whitelisting via AST & Schema Linting:**
   - The database schema is defined as a machine-readable JSON/YAML schema extracted from `1d`.
   - A deterministic CI script parses the generated Spring Boot JPA Entities (`@Entity`, `@Column`) and Flyway/SQL migrations using an Abstract Syntax Tree (AST) parser.
   - **Rule:** If the generated code introduces an entity, column, or relationship not present in the `1d` schema whitelist, **the build immediately fails**.
2. **OpenAPI Specification Diff:**
   - An OpenAPI spec is generated from the Spring Boot controllers at build time.
   - A diff tool compares the endpoints against `1d-technical-document.md#4`. Any undeclared path (e.g., `DELETE /api/permits/{id}` or `POST /api/permits/{id}/pay`) is flagged as an unapproved invention.
3. **Dependency and Framework Freezes:**
   - Prohibit the AI agent from adding new third-party dependencies or external service clients without explicit human consent.

### 4.2 Catching Silently Dropped Requirements
1. **Machine-Readable Requirements Traceability (RTM):**
   - Every acceptance criterion in `1c` has a unique key (`FR-01` to `FR-18`).
   - Every unit test, integration test, and service method in the code must be annotated:
     ```java
     @TargetRequirement(id = "FR-14", rule = "BR-4", description = "30-day fee cap")
     @Test
     void shouldCapFeeAtThirtyDaysWhenDurationExceedsCap() { ... }
     ```
   - A static analysis script verifies that every `FR-XX` key in `1c` has at least one matching passing test. If an agent silently omits the 30-day cap, the missing test annotation fails the build gate before review.
2. **Adversarial Dual-Agent Architecture:**
   - We separate generation from evaluation by running two independent agent roles:
     - **Generator Agent:** Given `1d`, writes the Spring Boot and React code.
     - **Critic / Verifier Agent:** Given *only* `1c (Functional Document)` and user stories. It has **never seen the generator's code**.
   - The Verifier Agent writes a comprehensive suite of black-box acceptance tests based solely on the functional requirements.
   - Running the Verifier's tests against the Generator's implementation instantly exposes any dropped acceptance criteria.

---

## 5. Where AI Helped Most vs. Where It Got in the Way

### 5.1 Where AI Helped Most
- **Contract & Schema Scaffolding:** Synthesizing TypeScript interfaces, Java records, JPA entity boilerplate, and Liquibase migrations from Markdown ERDs took seconds instead of hours.
- **Traceability Matrix Compilation:** AI was exceptional at cross-referencing `stories.md` against messy, informal emails in `clarifications.md` to flag potential contradictions (e.g., spotting Priya’s 30-day fee cap vs. the original story’s uncapped multiplication).
- **Test Case Edge Synthesis:** Generating parameterized test data covering date boundary conditions (e.g., leap years, exactly 90 days expired vs 91 days).

### 5.2 Where AI Got in the Way
- **Defaulting to Generic CRUD Patterns:** LLMs have a strong prior toward conventional patterns. When asked to implement renewals, the agent repeatedly attempted to insert a status check `permit.status == ACTIVE` only, discarding the 90-day expired grace window because "expired records shouldn't be mutable" in standard web applications.
- **Silent Assumption Smoothing:** When confronted with ambiguities (such as missing hall daily rates), the agent tended to invent arbitrary numbers without notifying the engineer, hiding commercial risks.
- **Over-Engineering Architectural Layers:** Left unconstrained, the agent attempted to scaffold CQRS event sourcing, Redis caching layers, and multi-tenant isolation for a straightforward single-council administrative register.

---

## 6. What We'd Do With Another Six Hours

If allocated an additional six hours, we would prioritize the following high-leverage items:

1. **Part 4 Agent & Verification Runner:**
   - Package the automated generator and AST linter into an executable CLI script (`npm run generate:journey -- --story=RC-4`) that generates the flowcharts, documents, and code for RC-4 (Withdraw) and executes the verification gate.
2. **Optimistic Locking & Concurrency Control:**
   - Add `@Version` fields to `PermitEntity` to handle the real-world scenario where two council officers open and renew the same permit simultaneously.
3. **End-to-End Playwright Suite:**
   - Implement browser-level integration tests asserting full journey flows: searching with filters, opening a detail view, launching the renewal modal, verifying the fee calculation banner, and confirming back-navigation retains search state.
4. **Interactive Audit Trail & Handover View:**
   - Directly resolve Hall Supervisor Sarah Lim's primary complaint regarding the "weekend handover" by building a visual timeline of all staff actions and state changes across shifts.

---

## 7. One Thing That Surprised You

**The profound disconnect between "Signed-Off Stories" and operational reality.**

In traditional software development, signed-off stories (`stories.md v1.2`) are treated as gospel. Yet, examining the post-signoff email thread revealed that the signed document was already obsolete before development began:
- Finance had capped renewal fees at 30 days two years ago, but nobody updated the BA story.
- Operations actively disliked the default sort order specified in the acceptance criteria.
- Council departments were being charged fees for their own halls because internal booking waivers were omitted from the initial requirements.

This demonstrates that software failure in AI-assisted environments is rarely a code syntax issue; it is a **requirements reconciliation failure**. An AI tool that blindly generates code from the "signed-off" requirements would produce a system that actively loses council revenue and infuriates users. The real engineering value lies in interrogating the gaps between what was signed and what is true.
