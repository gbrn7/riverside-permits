# Artifact 1c — Functional Document: RC-4 (Withdraw a Permit)

> **Audience:** Client Sign-off, Lead Business Analyst, and Compliance Stakeholders.  
> **Status:** Agreed & Authoritative

---

## 1. Journey Objective
To provide authorized council officers with an auditable, immediate mechanism to withdraw municipal hall permits before the booking start date, ensuring hall capacity is immediately released for re-allocation while strictly preventing post-commencement cancellations.

---

## 2. Requirements Traceability Matrix (RTM)

| Req ID | Business Rule | Acceptance Criterion | Source & Precedence | Verification Test |
| :--- | :--- | :--- | :--- | :--- |
| **FR-19** | **BR-11** | From the read-only Permit Detail screen, an eligible permit displays an active "Withdraw Permit" action. | `stories.md#RC-4 AC-1` | `PermitDetail.tsx`, `PermitWithdrawalIntegrationTest#shouldWithdrawEligiblePermit` |
| **FR-20** | **BR-12** | Withdrawal reason is mandatory, trimmed, non-blank, and capped at 500 characters. Blank or whitespace-only reasons are rejected. | `stories.md#RC-4 AC-2` | `PermitWithdrawalIntegrationTest#shouldRejectBlankReason`, `shouldRejectReasonExceeding500Chars` |
| **FR-21** | **BR-13** | Permits that have already started (`startDate <= today`) cannot be withdrawn; rejected with `400 PERMIT_ALREADY_STARTED`. Only permits starting in the future (`startDate > today`) can be withdrawn. | `clarifications.md` (Jonathan Wee / BA) | `PermitWithdrawalIntegrationTest#shouldRejectWithdrawalIfPermitAlreadyStarted` |
| **FR-22** | **BR-5** | On confirmation, the permit status immediately transitions to `WITHDRAWN`, releasing the hall reservation. | `stories.md#RC-4 AC-3` | `PermitWithdrawalIntegrationTest#shouldTransitionStatusToWithdrawn` |
| **FR-23** | **BR-9, BR-10** | A mandatory audit history record is inserted into `permit_history` containing `action = 'WITHDRAWN'`, the officer's reason in `detail`, and `performed_by = 'system'`. | `stories.md#RC-4 AC-3`, `clarifications.md` | `PermitWithdrawalIntegrationTest#shouldCreateAuditHistoryRecord` |
| **FR-24** | **BR-14** | A permit already in `WITHDRAWN` status is terminal and cannot be withdrawn again. Rejects with `409 WRONG_STATUS`. | Operational State Machine | `PermitWithdrawalIntegrationTest#shouldRejectWithdrawalIfAlreadyWithdrawn` |

---

## 3. Explicit Out-of-Scope Items
1. **Financial Refunds:** Per Finance Manager Priya Raghavan and the signed user story, withdrawal does not issue automated refunds. Council refunds are managed through external corporate accounting portals.
2. **Post-Commencement Cancellations:** Events currently in progress or in the past cannot be withdrawn via this mechanism.
