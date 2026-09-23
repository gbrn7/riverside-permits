# DECISIONS.md — Engineering & AI Architecture Rationale

> **Project:** Riverside Council — Community Hall Permit Register  
> **Evaluation Reference:** Engineer (Full-Stack, AI-Assisted) Build Test  
> **Author:** Candidate  
> **Date:** September 2026  

---

## Executive Summary

Building software from municipal public-sector requirements is fundamentally an exercise in **reconciliation and traceability**, not rapid code typing. In this project, raw inputs from four stakeholders directly contradicted each other: signed BA user stories specified one set of rules, while post-signoff communications from Finance and Hall Operations introduced statutory fee caps, grace periods for lapsed permits, and mandatory display overrides.

To navigate this complexity safely, I orchestrated AI as an active conductor: using a **dual-model evaluation strategy (Claude + Gemini)** to analyze and stress-test assumptions on `ASSUMPTIONS.md`, steering models iteratively through the 6-stage artifact pipeline, and establishing strict anti-hallucination and anti-drop verification gates. This document details the architectural decisions, AI orchestration workflows, scope tradeoffs, artifact evaluations, and quality controls implemented across the journey.

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

## 5. How I Orchestrated and Used AI Throughout This Project

AI was not treated as an autonomous "code oracle" or black-box generator. In public-sector municipal software involving statutory revenue and facility allocations, unmonitored AI generation is a direct commercial and compliance liability. Instead, I operated as a **system conductor and lead architect**, steering models through structured prompt chains, cross-examining multiple foundation models, and enforcing strict human-in-the-loop review gates.

### 5.1 The Human Conductor Model & Pipeline Orchestration
I structured the build into sequential, discrete cognitive stages:
1. **Deconstruction & Reconciliation:** Raw requirements (`stories.md` + `clarifications.md`) were fed to AI specifically for contradiction detection and stakeholder mapping, rather than asking for code directly.
2. **Progressive Artifact Elaboration:** The artifact pipeline was walked stage-by-stage:
   $$\text{Raw Inputs} \longrightarrow \text{1a (Business Flowchart)} \longrightarrow \text{1b (Technical Flowchart)} \longrightarrow \text{1c (Functional Doc)} \longrightarrow \text{1d (Technical Doc)}$$
   At each transition, I verified that no requirement was dropped or invented before prompting the next stage.
3. **Specification-First Code Generation:** AI coding assistants were instructed by `AGENTS.md` with the Prime Directive: *Build exclusively from `1d-technical-document.md`, never from raw requirements.* This prevented the AI from re-interpreting ambiguous stories on the fly.

### 5.2 Multi-Model Strategy: Comparing & Evaluating Claude and Gemini
To produce **`ASSUMPTIONS.md` (Part 3)**, I ran the conflicting source documents through both **Claude** and **Gemini**, evaluating and synthesizing their respective outputs:

1. **Comparative Strengths Observed:**
   - **Claude (Policy Hierarchy & Nuance):** Excelled at organizational hierarchy and policy weight. Claude immediately recognized that Finance Manager Priya Raghavan's email represented binding council fee regulations that supersede signed BA user stories. It produced thorough risk categorizations and explicit stakeholder escalation routes.
   - **Gemini (Technical Rigor & Mathematical Bounds):** Excelled at computational and schema implications. Gemini identified subtle date-math pitfalls (`ChronoUnit.DAYS.between` boundary conditions), noted the ambiguity between calendar days vs. business days for the 90-day grace period, and flagged how unapproved draft statuses affect database query performance.
2. **Cross-Evaluating Blind Spots:**
   - One model initially treated "Council Use bookings are free" purely as a fee waiver (`£0.00`), failing to recognize that the permit status must remain `ACTIVE` (bypassing the `AWAITING_PAYMENT` state entirely).
   - The other model caught this state transition rule but missed the tie-breaking rule for Ops sorting (`start_date ASC`, tie-breaker `created_at DESC`).
   - Cross-evaluating both models allowed me to merge the best insights into a single authoritative `ASSUMPTIONS.md` and informed the explicit business rules codified in `1d` and `AGENTS.md`. Relying on a single model creates single-point-of-failure cognitive biases.

### 5.3 Active Steering, Arguing & Course Corrections (The "Messy" Reality)
AI models constantly revert to generic patterns unless actively challenged. Throughout the test, I engaged in direct iterative steering:
- **Correcting the Expired Status Bias:** The AI repeatedly attempted to implement `permit.status == ACTIVE` as the sole renewal check, rejecting expired permits because standard web tutorials treat "expired" as a terminal dead state. I had to explicitly challenge the model with Finance's 90-day grace policy to ensure lapsed permits were handled correctly.
- **Enforcing the Statutory Fee Cap:** In early calculation drafts, the AI repeatedly generated `daysAdded * dailyRate`. I intervened to inject the statutory 30-day cap (`min(daysAdded, 30)`), pointing out that uncapped charges violate the 2024 Fees Review.
- **Preventing Hardcoded Enums:** When modeling halls, the AI defaulted to hardcoding a Java `enum` with the 4 halls. I rejected this design, referencing Jonathan Wee's chat note that Westfield Hall launches in Q4, forcing a normalized relational reference table.
- **Human-Readable Labels vs. Database Keys:** The AI frequently generated DTOs returning raw foreign keys (`hallId: 1`, `purposeId: 2`). I enforced supervisor Sarah Lim's requirement for human-readable labels (`hallName: "Riverside Community Hall"`).

### 5.4 Where AI Helped Most vs. Where It Got in the Way
- **Where AI Helped Most:**
  - **Rapid Contract & Boilerplate Scaffolding:** Translating relational schemas into JPA entities, DTO records, and TypeScript interfaces took minutes instead of hours.
  - **Comprehensive Edge Case Synthesis:** Brainstorming date boundary conditions (e.g., leap years, exactly 90 days vs 91 days expired).
  - **Traceability Matrix Compilation:** Cross-referencing 18 acceptance criteria across multiple documents.
- **Where AI Got in the Way:**
  - **Silent Assumption Smoothing:** Glossing over missing daily rates by inventing numbers rather than escalating the missing reference data.
  - **Architecture Bloat:** Attempting to introduce microservices, event buses, and complex abstractions for what should be a lean, high-reliability modular monolith.

### 5.5 Human-AI Pairing Protocol: How I Direct and Steer the AI in Practice
In this project, I used the AI assistant (Antigravity / CLI) as an active, high-velocity pairing partner, maintaining strict supervisory control through the following operational principles:

1. **Declarative Micro-Directives over Giant Vague Prompts:**
   Rather than issuing open-ended prompts like *"build the permit system"*, I guided the agent through concise, checkpointed commands. I instructed the agent to first parse deliverables from `BRIEF.md`, construct steering rules (`AGENTS.md`), capture architectural decisions (`DECISIONS.md`), and stage atomic Git commits before moving to code.
2. **Phase Gating & Roadmap Checkpoints:**
   I continually audited project phase alignment (e.g., asking *"now we are on which part"*, verifying deliverable completion against the brief). This prevents the AI from skipping foundational steps (like the assumptions artifact or technical document) and racing straight into code.
3. **Worktree Hygiene & Artifact Cleanup:**
   When iterative drafts produced duplicate or redundant files (such as `assumptions_2.md` and draft directories), I explicitly directed the AI to prune redundant files and commit clean states. Clean workspace context prevents model confusion and prompt cache pollution.
4. **Planning Before Implementation:**
   Before allowing the AI to write a single line of backend code in Part 2, I mandated: *"part 2 focus on build backend first, based on artifacts list the to do list step by step in the backend part"*. This forced the AI to construct an exhaustive, contract-traceable checklist mapped directly to `1d-technical-document.md` and `AGENTS.md`, establishing an explicit verification contract before coding begins.
5. **Enforcing Meta-Accountability:**
   I required the AI to record this steering methodology directly in `AGENTS.md` and `DECISIONS.md`. By forcing the AI system to document how it is steered, the engineering workflow itself becomes reproducible, auditable, and transparent to external evaluators.

### 5.6 Practical Case Study: How I Steered AI Through Auditing & TDD Remediation

A concrete demonstration of the **Human Conductor Model** occurred during our codebase verification and bug remediation session:

1. **Step 1: Scoped Requirement Decomposition (`analyse the requirement...`)**
   - **My Steering:** Rather than allowing the AI to write unguided code, I ordered a focused, structured breakdown of the job test requirements (`BRIEF.md`, `stories.md`, `clarifications.md`).
   - **Outcome:** The AI systematically cataloged all 4 user journeys (RC-1 through RC-4), highlighted the 8 core stakeholder contradictions, and isolated the financial non-negotiables (30-day statutory cap, Council Use £0 exemption, 90-day grace window).

2. **Step 2: Adversarial Multi-Agent Codebase Audit (`check all requirement in frontend and backend...`)**
   - **My Steering:** I directed the AI to audit both the Spring Boot backend and React frontend against the compiled specification.
   - **Orchestration:** The AI dispatched two parallel, isolated research subagents (Backend Auditor and Frontend Auditor) to inspect every file against the acceptance criteria and anti-hallucination rules.
   - **Findings:** Verified that the core financial logic was sound, while surfacing 6 backend edge-case bugs and 2 minor frontend display caveats.

3. **Step 3: Atomic, Disciplined TDD Remediation (`perbaiki bug 1`, `perbaik bug 2`, `oke sekarang bug 3 perbaiki`)**
   - **My Steering:** Rather than giving a blanket command (*"fix all bugs"*), which often leads to uncontrolled cross-file regressions, I enforced sequential, one-by-one bug resolution:
     - **Bug 1 (Search Exact Match → Prefix LIKE):** Directed remediation of `PermitService.java` where `cb.equal(...)` caused partial permit queries (`P-2026`) to return empty results. Added a failing integration test first (`shouldFilterByPermitNumberPrefix`), applied `cb.like(..., value + "%")`, and verified it passed.
     - **Bug 2 (Validation Fail-Fast Sequence):** Addressed the ordering bug in `PermitEligibilityValidator.java` where date validation preceded status validation. Re-sequenced the checks so that ineligible statuses (`WITHDRAWN`, `DRAFT`, `EXPIRED > 90d`) fail fast with HTTP 409 before date syntax is evaluated. Verified with both unit and HTTP integration tests.
     - **Bug 3 (Preview Contract Normalization):** Normalized the renewal preview endpoint to adhere strictly to `1d-technical-document.md` (`GET /api/permits/{id}/renewal-preview?newEndDate=YYYY-MM-DD`). Added Jackson aliases (`fee`, `capped`) in `RenewalPreviewDto.java`, updated `GlobalExceptionHandler.java`, adjusted the frontend API client in `api.ts`, and verified all 30 backend tests and the React frontend build passed without error.

4. **Step 4: Continuous Verification Gate**
   - At every single step, code changes were validated against the full test suite (`./mvnw test`) and the frontend compiler (`tsc -b && vite build`). No code was committed on faith or assumption.
   - Total backend integration and unit tests expanded from 24 to 30 passing tests.

5. **Step 5: Transparent Documentation (`write it on DECISIONS.md how i am use`)**
   - Captured the exact prompt sequence, reasoning, and test evidence in `DECISIONS.md`, ensuring full accountability for how human steering kept AI code generation strictly aligned with domain requirements.

---

## 6. What We'd Do With Another Six Hours

With Part 4's automated AI generator and dual-gate verifier now completed, tested, and committed, an additional six hours would be allocated to the following production enhancements:

1. **Optimistic Locking & Concurrency Control:**
   - Add `@Version` fields to `PermitEntity` to prevent race conditions when two council officers simultaneously attempt to action or renew the same permit record.
2. **End-to-End Playwright Automated Suite:**
   - Implement headless browser integration tests asserting the full user journey: applying multi-parameter filters, opening permit details, triggering the two-step renewal with fee cap preview, and testing the withdrawal modal with live 500-char counter.
3. **Interactive Audit Trail & Weekend Handover Dashboard:**
   - Directly resolve Hall Supervisor Sarah Lim's primary operational pain point by introducing a visual shift handover dashboard summarizing all staff mutations, cancellations, and fee waivers executed across shifts.
4. **CI/CD Integration for the AI Verification Gate:**
   - Wire `python3 pipeline/run_pipeline.py --verify-only` into GitHub Actions as a mandatory pull-request status check, permanently blocking any AI-generated PR that introduces undeclared schema concepts or fails 100% RTM test coverage.

---

## 7. One Thing That Surprised You

**The profound disconnect between "Signed-Off Stories" and operational reality.**

In traditional software development, signed-off stories (`stories.md v1.2`) are treated as gospel. Yet, examining the post-signoff email thread revealed that the signed document was already obsolete before development began:
- Finance had capped renewal fees at 30 days two years ago, but nobody updated the BA story.
- Operations actively disliked the default sort order specified in the acceptance criteria.
- Council departments were being charged fees for their own halls because internal booking waivers were omitted from the initial requirements.

This demonstrates that software failure in AI-assisted environments is rarely a code syntax issue; it is a **requirements reconciliation failure**. An AI tool that blindly generates code from the "signed-off" requirements would produce a system that actively loses council revenue and infuriates users. The real engineering value lies in interrogating the gaps between what was signed and what is true.
