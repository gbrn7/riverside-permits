# 1a — Business Flowchart
## Riverside Council · Community Hall Booking Permits
### Journeys: Search the Register · View a Permit · Renew a Permit

| Field | Detail |
|---|---|
| **Document reference** | MGG-1A |
| **Version** | 1.0 DRAFT |
| **Date** | 23 September 2026 |
| **Audience** | Permits Officers and council management — non-technical readers |
| **Status** | Awaiting client sign-off |

---

## Purpose of Document

This document shows, in plain language, how a Permits Officer moves through three journeys in the new Hall Permit Register:

- **RC-1 — Search the Register:** how an officer finds the permit they need.
- **RC-2 — View a Permit:** what information the officer sees when they open a permit.
- **RC-3 — Renew a Permit:** the steps an officer takes to extend a permit's end date, including the fee confirmation.

The diagrams are written for a non-technical audience. They show screens, decisions, and outcomes — not software internals. They are intended to be handed to council officers for review and sign-off before build begins.

---

## RC-1 · Search the Register

```mermaid
flowchart TD
    A([Officer opens the Permit Register])
    A --> B[All permits displayed\nSorted by earliest start date first]
    B --> C{Does the officer want\nto narrow the list?}

    C -- "No — browse as-is" --> E
    C -- "Yes — apply filters" --> D["Officer sets one or more optional filters:\nPermit number · Holder name\nHall · Purpose · Status · Date range"]

    D --> E["Screen shows matching permits\n10 per page\nColumns: Permit No · Holder · Hall · Purpose\nStatus · Start date · End date · Fee"]

    E --> F{Any permits\nfound?}

    F -- "No matches" --> G["Screen shows a\n'No permits found' message\nNo error — just an empty list"]
    F -- "Yes" --> H[Officer browses results\nand clicks any row to open it]

    G --> I{Officer wants\nto try again?}

    I -- "Yes — adjust filters" --> D
    I -- "Yes — start over" --> RESET[All filters cleared\nFull register reloaded]
    RESET --> B

    H --> OPEN([Officer opens a permit\nContinues in RC-2])
```

---

## RC-2 · View a Permit

```mermaid
flowchart TD
    START2([Officer arrives at permit detail screen\nfrom the search results])
    START2 --> K["Full permit details shown:\nAll fields · Fee · Status · Dates\nRenewal history if previously renewed\n\nRead-only — nothing can be changed here"]

    K --> L{What does the\nofficer do next?}

    L -- "Click Back" --> M[Return to search results\nFilters and page position\nkept exactly as they were]
    L -- "Click Renew" --> RENEW([Officer starts a renewal\nContinues in RC-3])

    M --> RESULTS([Back on the results list])
```

---

## RC-3 · Renew a Permit

```mermaid
flowchart TD
    START3([Officer clicks Renew on the permit detail screen])
    START3 --> N{What is the\ncurrent status\nof this permit?}

    N -- "Active" --> P[Permit is eligible\nfor renewal]
    N -- "Expired" --> O{Did it expire\nless than 90 days ago?}
    N -- "Awaiting Payment,\nWithdrawn, or Draft" --> Q["Screen shows a clear message:\nThis permit cannot be renewed\nin its current state"]

    O -- "Yes — within 90 days" --> P
    O -- "No — more than 90 days ago" --> Q

    Q --> BACK1[Return to permit detail screen]

    P --> R[Officer enters a new end date]
    R --> S{Is the new date\nafter the current\nend date?}

    S -- "No — date is too early" --> T[Screen shows an error message\nOfficer re-enters a later date]
    T --> R

    S -- "Yes — date is valid" --> U{Is this a\nCouncil Use permit?}

    U -- "Yes — Council Use" --> V["Confirmation screen shows:\nNew end date · Fee = £0\nNo payment will be collected"]
    U -- "No — other purpose" --> W["System calculates the renewal fee:\nNumber of days added × hall's daily rate\nMaximum charge: 30 days' worth\n\nConfirmation screen shows:\nNew end date · Fee amount"]

    V --> X["Confirmation screen shows the fee\nOfficer reads the total to the customer on the phone\nOnly commits after the customer agrees"]
    W --> X

    X -- "Customer declines / Cancel" --> Y[Nothing is saved\nReturn to permit detail screen\nno changes made]
    X -- "Customer agrees / Confirm" --> Z["Renewal saved:\nPrevious end date · New end date · Fee\nAdded to permit history"]

    Z --> AA{Council Use\npermit?}

    AA -- "Yes" --> AB[Permit end date updated\nStatus stays: Active]
    AA -- "No" --> AC[Permit end date updated\nStatus changes to: Awaiting Payment]

    AB --> DONE([Officer returned to updated permit detail screen])
    AC --> AD[Permit flagged for Finance to invoice]
    AD --> DONE
    Y --> DONE2([Officer returned to permit detail screen\nno changes made])
```

---

### Notes for reviewers

**Council Use permits are always free.**
When the purpose is "Council Use", the renewal fee is £0 and the permit moves straight to a confirmation screen — there is no payment step and the status remains Active after confirming.

**Expired permits have a 90-day grace window.**
An Expired permit can still be renewed, but only if it expired fewer than 90 days before today. After 90 days the renewal option is blocked and the officer sees a plain explanation on screen — not a technical error.

**Only Active and recently Expired permits can be renewed.**
Permits with a status of Awaiting Payment, Withdrawn, or Draft cannot be renewed. The screen shows a clear, plain-language message explaining this, and the officer is taken back to the permit detail view.

**Fee calculation for all other permits.**
The renewal fee equals the number of days being added multiplied by the hall's daily rate. The fee is capped: even if the extension is longer, the maximum charge equals 30 days' worth of the daily rate.

**The Reset button returns to a clean slate.**
Clicking Reset on the register screen removes all filters and reloads the full list of permits sorted by earliest start date. It does not delete or change any permits.

**Search filters are preserved when navigating.**
When an officer opens a permit from the search results and then clicks Back, they return to exactly the same results page with the same filters — they do not lose their place.

**The register is view-only browsing.**
Opening a permit from the register takes the officer to a read-only detail screen. Nothing on that screen can accidentally change the permit — changes only happen through the Renew action and the subsequent confirmation step.
