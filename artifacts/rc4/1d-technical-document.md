# Artifact 1d — Technical Document: RC-4 (Withdraw a Permit)

> **Audience:** Implementation Engineers and Automated AI Coding Agents.

---

## 1. API Endpoint Specification

### `POST /api/permits/{id}/withdraw`
Withdraws an existing permit that has not yet started.

#### Request Headers
`Content-Type: application/json`

#### Path Parameter
- `id` (Long, required): Database primary key of the permit.

#### Request Body (`WithdrawPermitRequest`)
```json
{
  "reason": "Holder called to cancel due to venue relocation"
}
```

| Field | Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `reason` | `String` | `@NotBlank`, `@Size(max = 500)` | Mandatory justification for permit withdrawal. |

#### Response Payloads
- **`200 OK`**: Returns updated `PermitDetailDto` with status `WITHDRAWN`.
- **`400 BAD_REQUEST`**:
  ```json
  {
    "error": "PERMIT_ALREADY_STARTED",
    "message": "Permit cannot be withdrawn because the event has already started (start date: 2026-06-01). Ongoing or past events must be processed via cancellation.",
    "timestamp": "2026-09-23T08:15:00"
  }
  ```
- **`404 NOT_FOUND`**: Permit ID does not exist.
- **`409 CONFLICT`**:
  ```json
  {
    "error": "WRONG_STATUS",
    "message": "Permit is already in terminal status WITHDRAWN and cannot be withdrawn again.",
    "timestamp": "2026-09-23T08:15:00"
  }
  ```

---

## 2. Business Rules & Validations

- **BR-11 (Action Availability):** UI displays withdraw button only when `permit.status != WITHDRAWN` and `permit.startDate > today`.
- **BR-12 (Reason Constraints):** Reason must be between 1 and 500 characters after trimming.
- **BR-13 (Start Date Invariant):** Server validates `permit.getStartDate().isAfter(LocalDate.now())`. If false, reject with `400 PERMIT_ALREADY_STARTED`.
- **BR-14 (Terminal Status Guard):** If `permit.getStatus() == PermitStatus.WITHDRAWN`, reject with `409 WRONG_STATUS`.
- **BR-15 (Transactional Atomicity):** In a single `@Transactional` boundary:
  1. `permit.setStatus(PermitStatus.WITHDRAWN)`
  2. `permit.setUpdatedAt(LocalDateTime.now())`
  3. `permitHistoryRepository.save(new PermitHistoryEntity(permit, "WITHDRAWN", request.reason(), "system"))`
