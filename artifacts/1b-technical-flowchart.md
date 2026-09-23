# Part 1b — Technical Flowchart: RC-1 Search, RC-2 View, RC-3 Renew

| Field | Detail |
|---|---|
| **Document reference** | MGG-1B |
| **Version** | 1.0 DRAFT |
| **Date** | 23 September 2026 |
| **Audience** | Engineers and technical reviewers |
| **Stack** | React SPA → Spring Boot REST API → Relational DB (H2) |
| **Status** | Internal — not for client sign-off |

---

## Purpose of Document

This document shows the technical flow of three journeys in the Hall Permit Register system, from browser interaction through to database reads and writes. It is intended for engineers building or reviewing the system.

For each journey it covers:
- which React component initiates the action and which API endpoint is called;
- which validations the Spring Boot API applies, in what order, and what error codes it returns on failure;
- which database tables are read or written, and in what sequence;
- the happy path and all documented unhappy paths.

**RC-3 (Renew)** is split into two diagrams — Preview (GET) and Confirm (POST) — because the two requests have different consequences and it is important that engineers understand the server re-validates everything on the POST, independent of the preview response.

This document should be read alongside:
- **1a (Business Flowchart)** — the same journeys for a non-technical audience.
- **1d (Technical Document)** — the data model, full endpoint contracts, and precise business rules to build from.

---

## System Architecture Overview

```mermaid
flowchart LR
    subgraph Client["Client Layer (React SPA)"]
        UI["Staff Portal UI\nSearch filters, Pagination, Form state"]
        ClientService["HTTP Client (Axios)\nError interceptor and type mapping"]
        UI <--> ClientService
    end

    subgraph Server["Application Layer (Spring Boot)"]
        Controller["REST Controllers\n@RestController @Validated"]
        Service["Domain Service Layer\n@Service @Transactional"]
        Repo["Spring Data JPA Repositories\nSpecification Builder"]
        Controller <--> Service
        Service <--> Repo
    end

    subgraph Data["Persistence Layer (Relational DB - H2)"]
        DB[("Tables:\npermits, halls, purposes\nrenewal_records, permit_history")]
    end

    Repo <--> DB
    ClientService <-->|"JSON over HTTP REST"| Controller
```

---

## RC-1 — Search Permits

```mermaid
flowchart TD
    subgraph Browser1["Browser / React SPA"]
        A1([User fills Search Form])
        A1 --> B1["Build query params:\npermitNumber, holderName, hallId\npurposeId, status, startDateFrom\nstartDateTo, page, size"]
        B1 --> C1["GET /api/permits?params"]
        R1a[Render paginated result table]
        R1b[Show No results found message]
    end

    subgraph API1["Spring Boot REST API"]
        D1[Apply defaults:\npage=0, size=10\nsort: start_date ASC]
        D1_ERR["Return 400 Bad Request\ninvalid query parameters"]
        E1[Build JPA Specification\nfrom non-null params]
        F1[Execute paged query]
        G1{Rows\nfound?}
        H1[Map rows to PermitSummaryDto list\nWrap in Page response]
        I1[Return 200 Page with empty content]
        J1[Return 200 Page of PermitSummaryDto]
    end

    subgraph DB1["Relational DB (H2)"]
        L1[("SELECT permits\nJOIN halls, purposes\nWHERE filters\nORDER BY start_date ASC\nLIMIT/OFFSET page")]
    end

    C1 --> D1
    D1 --> E1
    E1 --> F1
    F1 --> L1
    L1 -->|result set| G1
    G1 -->|Yes| H1
    G1 -->|No - empty set| I1
    H1 --> J1
    J1 -->|200 + data| R1a
    I1 -->|200 + empty page| R1b
```

---

## RC-2 — View Permit Detail

```mermaid
flowchart TD
    subgraph Browser2["Browser / React SPA"]
        A2([User clicks permit row])
        A2 --> B2["GET /api/permits/{id}"]
        R2a["Render Permit Detail page\n- core fields\n- renewal history table\n- audit history table"]
        R2b[Show Permit not found error]
    end

    subgraph API2["Spring Boot REST API"]
        C2[Parse path variable id]
        D2{Permit\nexists?}
        E2["Return 404\nerror: PERMIT_NOT_FOUND"]
        F2["SELECT permits\nJOIN halls, purposes\nWHERE id = :id"]
        G2["SELECT renewal_records\nWHERE permit_id = :id\nORDER BY performed_at DESC"]
        H2["SELECT permit_history\nWHERE permit_id = :id\nORDER BY performed_at DESC"]
        I2["Map to PermitDetailDto\nwith renewalHistory and history arrays"]
        J2[Return 200 PermitDetailDto]
    end

    subgraph DB2["Relational DB (H2)"]
        DB2a[("permits JOIN halls, purposes")]
        DB2b[("renewal_records")]
        DB2c[("permit_history")]
    end

    B2 --> C2
    C2 --> D2
    D2 -->|No| E2
    E2 -->|404| R2b
    D2 -->|Yes| F2
    F2 --> DB2a
    DB2a -->|permit row| G2
    G2 --> DB2b
    DB2b -->|renewal rows| H2
    H2 --> DB2c
    DB2c -->|history rows| I2
    I2 --> J2
    J2 -->|200 full detail| R2a
```

---

## RC-3a — Renew Permit: Preview

```mermaid
flowchart TD
    subgraph BrowserPV["Browser / React SPA"]
        A3([User clicks Renew on Permit Detail])
        A3 --> B3[User enters new end date]
        B3 --> C3["GET /api/permits/{id}/renewal-preview\n?newEndDate=YYYY-MM-DD"]
        PV_OK["Display fee preview:\nnewEndDate, daysAdded,\ncappedDays, fee, capped flag"]
        PV_ERR[Show inline validation error]
    end

    subgraph APIPV["Spring Boot REST API - GET renewal-preview"]
        P1{Permit\nexists?}
        P1N[404 PERMIT_NOT_FOUND]
        P2{Status is\nACTIVE or EXPIRED?}
        P2N[409 WRONG_STATUS]
        P3{If EXPIRED:\ndays since end_date\nis 90 or fewer?}
        P3N[409 EXPIRED_TOO_LONG]
        P4{newEndDate is\nafter permit.end_date?}
        P4N[400 INVALID_END_DATE]
        P5["Calculate fee:\ndaysAdded = DAYS(newEndDate - end_date)\ncappedDays = min(daysAdded, 30)\nfee = is_council_use ? 0.00 : cappedDays x daily_rate"]
        P6["Return 200 RenewalPreviewDto\nnewEndDate, daysAdded, cappedDays, fee, capped"]
    end

    subgraph DBPV["Relational DB (H2)"]
        DBPV1[("SELECT permits\nJOIN halls, purposes\nWHERE id = :id")]
    end

    C3 --> P1
    P1 -->|No| P1N
    P1N -->|404| PV_ERR
    P1 -->|Yes| DBPV1
    DBPV1 -->|permit row| P2
    P2 -->|No| P2N
    P2N -->|409| PV_ERR
    P2 -->|Yes| P3
    P3 -->|No - over 90 days| P3N
    P3N -->|409| PV_ERR
    P3 -->|Yes - within 90d or ACTIVE| P4
    P4 -->|No| P4N
    P4N -->|400| PV_ERR
    P4 -->|Yes| P5
    P5 --> P6
    P6 -->|200 preview| PV_OK
```

---

## RC-3b — Renew Permit: Confirm

```mermaid
flowchart TD
    subgraph BrowserPOST["Browser / React SPA"]
        START3b([User reviews preview and clicks Confirm])
        START3b --> POST["POST /api/permits/{id}/renewals\nBody: { newEndDate }"]
        OK[Refresh to updated Permit Detail page]
        ERR[Show error message from API response]
    end

    subgraph APIPOST["Spring Boot REST API - POST renewals"]
        R1{Permit\nexists?}
        R1N[404 PERMIT_NOT_FOUND]
        R2{Status is\nACTIVE or EXPIRED?}
        R2N[409 WRONG_STATUS]
        R3{If EXPIRED:\ndays since end_date\nis 90 or fewer?}
        R3N[409 EXPIRED_TOO_LONG]
        R4{newEndDate is\nafter end_date?}
        R4N[400 INVALID_END_DATE]
        R5["Recalculate fee\n(same formula as preview)"]
        R6["Determine new status:\nis_council_use true  -> ACTIVE\nis_council_use false -> AWAITING_PAYMENT"]
        R7[BEGIN TRANSACTION]
        R8["INSERT renewal_records\n(permit_id, previous_end_date,\nnew_end_date, fee, performed_at)"]
        R9["UPDATE permits SET\nend_date=newEndDate,\nstatus=newStatus,\nupdated_at=now()"]
        R10["INSERT permit_history\n(action=RENEWED, detail JSON,\nperformed_at)"]
        R11{All writes\nsucceed?}
        R12["COMMIT\nReturn 200 PermitDetailDto"]
        R13["ROLLBACK\nReturn 500 DB_ERROR"]
    end

    subgraph DBPOST["Relational DB (H2)"]
        DBPOST1[("SELECT permits\nJOIN halls, purposes\nWHERE id = :id")]
        DBPOST2[("INSERT renewal_records")]
        DBPOST3[("UPDATE permits")]
        DBPOST4[("INSERT permit_history")]
    end

    POST --> R1
    R1 -->|No| R1N
    R1N -->|404| ERR
    R1 -->|Yes| DBPOST1
    DBPOST1 -->|permit row| R2
    R2 -->|No| R2N
    R2N -->|409| ERR
    R2 -->|Yes| R3
    R3 -->|No| R3N
    R3N -->|409| ERR
    R3 -->|Yes| R4
    R4 -->|No| R4N
    R4N -->|400| ERR
    R4 -->|Yes| R5
    R5 --> R6
    R6 --> R7
    R7 --> R8
    R8 --> DBPOST2
    DBPOST2 --> R9
    R9 --> DBPOST3
    DBPOST3 --> R10
    R10 --> DBPOST4
    DBPOST4 --> R11
    R11 -->|Yes| R12
    R11 -->|No| R13
    R12 -->|200 updated detail| OK
    R13 -->|500| ERR
```

---

## Endpoint Summary Table

| # | Method | Endpoint | Query / Body | DB Operation | Success | Error Codes |
|---|--------|----------|--------------|--------------|---------|-------------|
| 1 | `GET` | `/api/permits` | `permitNumber`, `holderName`, `hallId`, `purposeId`, `status`, `startDateFrom`, `startDateTo`, `page=0`, `size=10` | `SELECT` permits + joins, paginated, `ORDER BY start_date ASC` | `200 Page<PermitSummaryDto>` (empty page if no rows) | — |
| 2 | `GET` | `/api/permits/{id}` | Path: `id` | `SELECT` permit + joins; `SELECT` renewal_records; `SELECT` permit_history | `200 PermitDetailDto` with `renewalHistory[]`, `history[]` | `404 PERMIT_NOT_FOUND` |
| 3 | `GET` | `/api/permits/{id}/renewal-preview` | Path: `id`; Query: `newEndDate` | `SELECT` permit + joins (read-only) | `200 RenewalPreviewDto {newEndDate, daysAdded, cappedDays, fee, capped}` | `404 PERMIT_NOT_FOUND`, `400 INVALID_END_DATE`, `409 WRONG_STATUS`, `409 EXPIRED_TOO_LONG` |
| 4 | `POST` | `/api/permits/{id}/renewals` | Path: `id`; Body: `{newEndDate}` | **Transaction:** `INSERT` renewal_records → `UPDATE` permits → `INSERT` permit_history | `200 PermitDetailDto` (updated) | `404 PERMIT_NOT_FOUND`, `400 INVALID_END_DATE`, `409 WRONG_STATUS`, `409 EXPIRED_TOO_LONG`, `500 DB_ERROR` |

---

### Fee Calculation Reference

```
daysAdded  = DAYS(newEndDate - permit.end_date)
cappedDays = MIN(daysAdded, 30)
fee        = purpose.is_council_use ? 0.00 : cappedDays x hall.daily_rate
```

### Status Transition on Renewal

```
is_council_use = true   ->  status stays   ACTIVE
is_council_use = false  ->  status becomes AWAITING_PAYMENT
```

### Eligibility Rules (applied in both preview and commit)

| Check | Condition | Error |
|-------|-----------|-------|
| Status | `ACTIVE` or `EXPIRED` | `409 WRONG_STATUS` |
| Expiry window | If `EXPIRED`: `DAYS(today - end_date) <= 90` | `409 EXPIRED_TOO_LONG` |
| Date order | `newEndDate > permit.end_date` | `400 INVALID_END_DATE` |
