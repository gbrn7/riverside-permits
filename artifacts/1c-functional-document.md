# Riverside Council — Hall Permit Register
## Functional Document: RC-1 Search · RC-2 View · RC-3 Renew

---

## Purpose of Document

This document describes what the Riverside Council Hall Permit Register system does, written so that council officers, Finance staff, and Operations managers can confirm the described behaviour matches their requirements and sign it off before development is finalised.

It is the **client-facing agreement** for this release. Every acceptance criterion is accounted for, including requirements that arrived after the stories were signed off (via email and chat clarifications). Where this document differs from the signed stories, the deviation is stated explicitly in Section 8 along with the reason and source.

This document covers:
- **RC-1 — Search the Register:** finding permits using filters.
- **RC-2 — View a Permit:** reading the full detail of a single permit.
- **RC-3 — Renew a Permit:** extending a permit's end date, including fee calculation and confirmation.

It does **not** contain implementation detail. Readers looking for data models, endpoint specifications, or technical business rules should refer to **1d (Technical Document)**.

---

| Field | Detail |
|---|---|
| **Document reference** | MGG-FUNC-1C |
| **Version** | 1.0 DRAFT |
| **Date** | 23 September 2026 |
| **Prepared by** | [Project Team] |
| **Audience** | Riverside Council officers, Finance, Operations management |
| **Status** | Awaiting client sign-off |

---

## Document Control & Sign-Off

| Role | Name | Department | Sign-Off Status |
|:---|:---|:---|:---:|
| **Lead Business Analyst** | BA Team Lead | Digital Transformation | Approved |
| **Finance Manager** | Priya Raghavan | Finance & Revenue | Approved — with fee cap and Council Use override |
| **Operations Manager** | Jonathan Wee | Public Facilities & Hall Ops | Approved — with sort order override |
| **Hall Operations Supervisor** | Sarah Lim | Facilities Staff Operations | Approved — with full-name display requirement |

---

## 1. Document Overview

### 1.1 Purpose

This document describes what the Riverside Council Hall Permit Register system does, as agreed between Riverside Council and the project team. It is written so that council officers, Finance staff, and Operations managers can confirm that the described behaviour matches their requirements before development is finalised.

It covers three functional areas of the register:

- **RC-1 Search** — finding permits in the register
- **RC-2 View** — reading the full details of a single permit
- **RC-3 Renew** — extending the end date of a qualifying permit

### 1.2 What this document is not

This document does not describe how the system is built. It does not contain database structures, code, or technical design decisions. Readers do not need any technical background to review or sign off this document.

### 1.3 Scope of this release

This release covers the internal officer-facing register only. Functionality excluded from this release is listed in full in [Section 7 — Out of Scope](#7-out-of-scope).

### 1.4 How to read this document

Each functional area lists numbered acceptance criteria (ACs). These are the specific, testable statements of behaviour that the system must satisfy. Where an AC differs from the originally signed user story — because of a clarification received after sign-off — the change is flagged inline and also summarised in [Section 8 — Deviations from Signed Stories](#8-deviations-from-signed-stories).

---

## 2. Requirements Traceability Matrix

Every requirement from `stories.md` and `clarifications.md` is catalogued below with its final binding determination:

| Req ID | Origin | Original Requirement | Final Determination | Impact |
|:---|:---|:---|:---|:---|
| FR-01 | stories.md RC-1 AC-1 | Search by permit number, holder name, hall, purpose, status, date range | **Accepted in full.** Holder name is case-insensitive substring match. All filters optional. | Multi-filter query engine |
| FR-02 | stories.md RC-1 AC-2 | Return full register if no filters supplied | **Accepted in full.** Default view shows all permits. | Base query without predicates |
| FR-03 | stories.md RC-1 AC-3 vs chat (Jonathan Wee, 19 May) | Stories: most recently created first. Ops: start date soonest first. | **Ops clarification supersedes.** Default order is `start_date ASC`, tie-breaker `created_at DESC`. Pending formal sign-off. | Default sort definition |
| FR-04 | stories.md RC-1 AC-3 | Pagination: 10 rows per page | **Accepted in full.** | Paginated grid controls |
| FR-05 | stories.md RC-1 AC-4 vs email (Sarah Lim, 22 May) | Stories: show hall and purpose. Supervisor: show full names, no codes. | **Supervisor clarification enforced.** Full descriptive names only (e.g. *Riverside Community Hall*). | DTO and UI projection |
| FR-06 | stories.md RC-1 AC-5 | Reset button clears all filters | **Accepted in full.** | UI state reset |
| FR-07 | stories.md RC-1 AC-6 | Empty state if no matches, not an error | **Accepted in full.** Informative banner shown. | Empty state component |
| FR-08 | stories.md RC-2 AC-1 | Full permit detail including renewal history | **Accepted in full.** Shows all fields, chronological renewal timeline. | Detail view layout |
| FR-09 | stories.md RC-2 AC-2 | View is read-only | **Accepted in full.** No editable fields. | Immutability protection |
| FR-10 | stories.md RC-2 AC-3 | Back navigation preserves filters | **Accepted in full.** Filter values and page number retained. | URL/state cache |
| FR-11 | stories.md RC-3 AC-1 | Renewal initiated from view by entering new end date | **Accepted in full.** | Renewal modal/form |
| FR-12 | stories.md RC-3 AC-2 | New end date must be after current end date | **Accepted in full.** Client and server validation. | Date range validator |
| FR-13 | stories.md RC-3 AC-3 vs email (Priya Raghavan, 12 May) | Stories: only ACTIVE permits renewable. Finance: EXPIRED ≤ 90 days also renewable. | **Finance policy overrides.** ACTIVE and EXPIRED within 90 days eligible. Over 90 days blocked. | Eligibility state engine |
| FR-14 | stories.md RC-3 AC-4 vs email (Priya Raghavan, 12 May) | Stories: days × daily rate. Finance: cap at 30 days. | **Finance statutory cap enforced.** Fee = min(days added, 30) × daily rate. | Capped pricing calculator |
| FR-15 | clarifications.md (Priya Raghavan, 12 May) | Council Use bookings are free (£0.00), no payment step | **Finance policy enforced.** Fee = £0, skips payment workflow, status stays ACTIVE. | Zero-fee waiver |
| FR-16 | stories.md RC-3 AC-5 + chat (Jonathan Wee, 4 Jun) | Officer shown calculated fee and must confirm before save. Fee must be exact invoice amount. | **Accepted in full.** Two-step confirmation showing full cost breakdown before any DB write. | Confirmation modal |
| FR-17 | stories.md RC-3 AC-6 | On confirm: save renewal record, update end date, update status, write history | **Accepted in full** (with FR-15 exception for Council Use). | Atomic transactional execution |
| FR-18 | clarifications.md (Jonathan Wee, 4 Jun) | Westfield Hall coming Q4; do not hardcode halls | **Accepted in full.** Halls managed via database reference table. | Dynamic reference data |

---

## 3. Reference Data

### 2.1 Halls

The register covers the following halls. Hall names are stored and displayed in full — no codes or abbreviations are used anywhere in the system.

| Hall name |
|---|
| Riverside Community Hall |
| Eastgate Pavilion |
| Northbrook Function Room |
| Southbank Assembly Hall |

> [!IMPORTANT]
> The hall list is **not fixed**. New halls (for example, Westfield Hall, expected Q4) will be added by an administrator without any system rebuild or code change. The system is designed to accommodate this from the outset.

### 2.2 Booking Purposes

The register recognises the following booking purposes. Purpose names are stored and displayed in full — no codes or abbreviations are used.

| Purpose name | Notes |
|---|---|
| Community Event | — |
| Religious Service | — |
| Private Function | — |
| Commercial Use | — |
| Council Use | Bookings by Riverside Council's own departments. Special fee rules apply — see [Section 5.3](#53-fee-calculation). |

---

## 3. Permit Statuses

Every permit in the register carries exactly one of the following statuses at any point in time.

| Status | Meaning |
|---|---|
| **DRAFT** | The booking has been submitted but has not yet been approved. |
| **ACTIVE** | The permit has been approved and is currently in effect. |
| **AWAITING PAYMENT** | The permit has been renewed but the renewal fee has not yet been confirmed as received. Payment confirmation is handled by a separate council system, not by this register. |
| **EXPIRED** | The permit's end date has passed and the permit has not been renewed. |
| **WITHDRAWN** | The permit has been withdrawn at the holder's request. |

---

## 4. RC-1: Search the Register

### 4.1 Overview

Officers can search the full register of permits using any combination of filter criteria. The search is designed to be flexible: no filter is mandatory, and the officer is always in control of which criteria to apply.

### 4.2 Acceptance Criteria

**AC-1.1 — Filter fields available**
The search screen provides the following filter fields, each of which is independent and optional:

- Permit number (exact or partial match)
- Permit holder name (partial match, not case-sensitive — for example, searching "smith" returns "A. Smith" and "Smithfield Events")
- Hall (selected from the list of halls in Section 2.1)
- Purpose (selected from the list of purposes in Section 2.2)
- Status (selected from the statuses in Section 3)
- Date range — a start date and/or end date to filter by the permit's active period

**AC-1.2 — All filters optional**
The officer may use any number of filters, including none at all. Submitting the search with no filters applied returns the entire register.

**AC-1.3 — Default sort order**
Results are sorted by **start date, soonest first** by default.

> [!NOTE]
> *Clarification applied.* The original signed user story specified "most recently created first." Following discussion with Ops Manager Jonathan Wee (19 May 2026), the default sort has been changed to start date, soonest first. This is accepted for this build. Formal sign-off on this change is pending — see [Section 8](#8-deviations-from-signed-stories) and [Section 9](#9-open-questions-pending-sign-off).

**AC-1.4 — Results grid columns**
Search results are displayed in a table. Each row shows the following fields for one permit:

| Column | Description |
|---|---|
| Permit number | The unique identifier for the permit |
| Holder name | The name of the permit holder |
| Hall | Full hall name (not a code) |
| Purpose | Full purpose name (not a code) |
| Status | Current permit status |
| Start date | The date the permit period begins |
| End date | The date the permit period ends |
| Fee | The fee associated with the permit |

**AC-1.5 — Pagination**
Results are displayed 10 rows per page. The officer can navigate between pages. The total number of results is visible so the officer knows how many permits match.

**AC-1.6 — Reset control**
A Reset (or Clear) control is available on the search screen. Activating it clears all filter fields back to their default (empty) state, ready for a new search.

**AC-1.7 — No results state**
If no permits match the applied filters, the system displays a clear message indicating that no matching permits were found. This is an expected, normal outcome — the system does not treat it as an error.

---

## 5. RC-2: View a Permit

### 5.1 Overview

An officer can open any permit from the search results to view its complete details. The view screen is read-only — no changes can be made from it.

### 5.2 Acceptance Criteria

**AC-2.1 — Full permit detail**
Opening a permit from the search results displays the full permit record, including:

- All fields shown in the search results grid (permit number, holder name, hall, purpose, status, start date, end date, fee)
- Any additional fields held against the permit that are not shown in the grid
- The complete **renewal history** for the permit, showing all past renewals in chronological order

**AC-2.2 — Read-only**
The view screen does not allow any field to be edited. The officer can only read the information displayed. (Renewing a permit is a separate action — see Section 5.)

**AC-2.3 — Return to results**
The officer can navigate back to the search results screen. When they do, all previously applied filters are still in place and the results list is unchanged. The officer does not need to re-enter their search criteria.

---

## 6. RC-3: Renew a Permit

### 6.1 Overview

An officer can renew a qualifying permit to extend its end date. Renewal involves entering a new end date, reviewing the calculated fee, and confirming the renewal. The system then records the renewal and updates the permit accordingly.

### 6.2 Which Permits May Be Renewed

**AC-3.1 — Eligible permit statuses**
A permit may be renewed if its current status is:

- **ACTIVE**, or
- **EXPIRED**, provided the permit expired **no more than 90 days ago**

> [!NOTE]
> *Clarification applied.* The original signed user story restricted renewal to ACTIVE permits only. Following clarification from Finance Manager Priya Raghavan (email, 12 May 2026), EXPIRED permits within 90 days of their expiry date are also eligible. This reflects council policy.

**AC-3.2 — Ineligible permits**
A permit may **not** be renewed if:

- Its status is DRAFT, AWAITING PAYMENT, or WITHDRAWN, **or**
- Its status is EXPIRED and it expired **more than 90 days ago** — in this case, the permit holder must submit a fresh booking

When a permit is not eligible for renewal, the Renew action is not available on the permit view screen, and the reason is clearly communicated to the officer.

### 6.3 Entering a New End Date

**AC-3.3 — Officer enters new end date**
When renewing, the officer enters the new end date for the permit.

**AC-3.4 — New end date must be later than current end date**
The new end date must be strictly after the permit's current end date. If the officer enters a date that is on or before the current end date, the system rejects it and displays a clear explanatory message. No renewal is saved.

### 6.4 Fee Calculation

**AC-3.5 — Standard renewal fee (non-Council Use)**
For all permits except those with purpose **Council Use**, the renewal fee is calculated as follows:

- **Base rate:** hall daily rate × number of calendar days being added (the difference between the new end date and the current end date)
- **Cap:** the fee is capped at a maximum of **30 days of the hall's daily rate**, regardless of how many days are actually being added

In plain terms: no matter how long the extension is, the officer will never be charged more than the equivalent of 30 days at the hall's daily rate. This reflects Riverside Council's fees policy as established in the 2024 fees review.

> [!IMPORTANT]
> The fee shown to the officer at the confirmation step is **the actual invoiceable amount** — that is, the fee after the 30-day cap has been applied, not the uncapped calculation.

> [!NOTE]
> *Clarification applied.* The original signed user story stated the fee was hall daily rate × days added, with no cap. The 30-day cap was introduced by Finance Manager Priya Raghavan (email, 12 May 2026) as a mandatory policy requirement.

**AC-3.6 — Council Use fee**
Permits with purpose **Council Use** are always free to renew. The fee is **£0**. The fee confirmation step still appears (so the officer can see and acknowledge that no charge applies), but no payment step follows.

### 6.5 Confirmation Step

**AC-3.7 — Officer must confirm before anything is saved**
Before any change is made to the permit, the system presents a confirmation screen showing:

- The new end date
- The calculated renewal fee (the actual invoiceable amount, after the 30-day cap, or £0 for Council Use)
- A prompt for the officer to confirm or cancel

Nothing is saved to the register until the officer explicitly confirms. If the officer cancels, the permit remains unchanged.

### 6.6 What Happens on Confirmation

Once the officer confirms, the system performs all of the following:

**AC-3.8 — Renewal record created**
A renewal record is added to the permit's history, capturing the renewal event (including the old end date, new end date, and fee charged).

**AC-3.9 — Permit end date updated**
The permit's end date is updated to the new end date entered by the officer.

**AC-3.10 — Permit status updated**
The permit's status is updated as follows:

| Permit purpose | New status after renewal |
|---|---|
| Any purpose **except** Council Use | **AWAITING PAYMENT** |
| **Council Use** | **ACTIVE** (remains active; no payment required) |

**AC-3.11 — Renewal history updated**
The permit's renewal history (visible on the view screen — see AC-2.1) is updated immediately to reflect the renewal that has just taken place.

---

## 7. Out of Scope

The following items have been considered during requirements discussions and are explicitly **not** included in this release. They are documented here to avoid ambiguity.

| Item | Notes |
|---|---|
| **Public booking portal** | This release covers the internal officer-facing register only. A public-facing portal for permit holders to submit or manage bookings is not in scope. |
| **RC-4: Withdraw a permit** | The requirement to allow officers to withdraw permits has been noted and is fully excluded from this release. It is expected to be addressed in a future release. |
| **Payment processing** | The register moves a renewed permit to AWAITING PAYMENT status and stops there. Receipt and confirmation of payment is handled by a separate Riverside Council system. No payment functionality is built into this register. |
| **Excel / CSV export of the register** | Officers cannot export search results from this release. |
| **Audit trail (who-touched-what)** | The register does not record which officer performed which action. If this is required, it must be raised as a separate requirement. |
| **Permit printing** | Officers cannot print or generate a PDF of a permit from this register. |
| **Remembering last search** | The system does not remember a user's previous search between sessions. Returning to the search screen starts fresh (though returning within the same session while viewing a permit preserves filters — see AC-2.3). |
| **AWAITING PAYMENT timeout / expiry logic** | The register does not automatically expire or act on permits that remain in AWAITING PAYMENT status. Any such logic is outside scope. |
| **Authentication and user management** | User login, roles, and permissions are not part of this functional scope. |

---

## 8. Deviations from Signed Stories

The following items differ from the acceptance criteria as originally signed off. Each change came from a post-sign-off clarification and has been accepted for this build. Items marked as **pending formal sign-off** require written confirmation from Riverside Council before they can be considered fully agreed.

| # | Affected story | Original signed AC | Revised behaviour | Source | Formal sign-off |
|---|---|---|---|---|---|
| D-1 | RC-3 Renew | Only ACTIVE permits may be renewed | ACTIVE permits and EXPIRED permits within 90 days of expiry may be renewed. Permits expired more than 90 days require a fresh booking. | Finance Manager Priya Raghavan, email 12 May 2026 | **Pending** |
| D-2 | RC-3 Renew | Renewal fee = hall daily rate × days added | Fee is capped at 30 days of the hall's daily rate. Fee shown at confirmation is the capped (actual invoiceable) amount. | Finance Manager Priya Raghavan, email 12 May 2026 | **Pending** |
| D-3 | RC-3 Renew | (Not in original story) | Council Use permits are free (£0); no payment step; permit remains ACTIVE after renewal. | Finance Manager Priya Raghavan, email 12 May 2026 | **Pending** |
| D-4 | RC-1 Search | Default sort: most recently created first | Default sort: start date, soonest first. | Ops Manager Jonathan Wee, chat 19 May 2026 | **Pending** |
| D-5 | RC-1 Search | (Not specified in original story) | Hall list is not hardcoded; new halls can be added without a system rebuild. | Ops Manager Jonathan Wee, chat 4 Jun 2026 | **Pending** |
| D-6 | RC-1 Search / RC-2 View | (Not specified in original story) | Full hall names and full purpose names must be displayed throughout — no codes or abbreviations. | Hall Supervisor Sarah Lim, email 22 May 2026 | **Pending** |

---

## 9. Open Questions Pending Sign-Off

The items below require a formal written response from Riverside Council before they can be closed.

| # | Question | Raised by | Date raised | Status |
|---|---|---|---|---|
| OQ-1 | **Default sort order (D-4 above).** The change from "most recently created first" to "start date, soonest first" has been verbally accepted. A formal written confirmation is required to update the signed story baseline. | Ops Manager Jonathan Wee | 19 May 2026 | **Awaiting written sign-off** |
| OQ-2 | **D-1, D-2, D-3 — Renewal rule changes.** The three fee and eligibility changes summarised in D-1, D-2, and D-3 were communicated by email. Formal written sign-off against this document (or a change request) is required. | Finance Manager Priya Raghavan | 12 May 2026 | **Awaiting written sign-off** |
| OQ-3 | **D-5 — Hall list administration.** Who is responsible for adding new halls to the system? Is there an administration screen required, or will this be done by the technical team directly? This affects whether a hall management screen is needed in a future release. | Ops Manager Jonathan Wee | 4 Jun 2026 | **Awaiting clarification** |
| OQ-4 | **RC-4 Withdraw — future release priority.** RC-4 is out of scope for this release. Has Riverside Council confirmed when it is expected, and whether it should be the first item in the next release? | Project Team | — | **Awaiting confirmation** |
| OQ-5 | **AWAITING PAYMENT timeout.** If a permit sits in AWAITING PAYMENT status indefinitely because payment is not received, what should happen? This is currently out of scope but the council may wish to define a policy before the payment integration is addressed. | BA | 28 May 2026 | **Awaiting policy decision** |

---

*End of document — MGG-FUNC-1C v1.0 DRAFT*
