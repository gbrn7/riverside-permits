#!/usr/bin/env python3
"""
pipeline/generator.py — Downstream Artifact & Code Generator for RC-4

Consumes the reconciled requirements specification from pipeline/reconciler.py,
generates the complete 4-stage artifact chain in artifacts/rc4/,
and generates the backend and frontend code implementations.
"""

import os
import json
from pathlib import Path

def generate_artifacts(base_dir: Path, spec: dict):
    out_dir = base_dir / "artifacts" / "rc4"
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1a. Business Flowchart (Non-Technical: screens, actions, decisions, no technical jargon)
    doc_1a = """# Artifact 1a — Business Flowchart: RC-4 (Withdraw a Permit)

> **Audience:** Non-technical council officers, Hall Supervisors, and Public-Sector Stakeholders  
> **Rule:** No HTTP verbs, no database tables, no JSON fields, no technical jargon.

```mermaid
flowchart TD
    Start(["Officer opens Permit Details screen"]) --> CheckStatus{"Is the permit already withdrawn?"}
    
    CheckStatus -- "Yes" --> NoAction["Withdraw button is disabled\\nNotice: Permit is already withdrawn"]
    CheckStatus -- "No" --> CheckDate{"Has the event already started?\\n(Today is on or after Start Date)"}
    
    CheckDate -- "Yes (Event started)" --> BlockStarted["Withdraw button is disabled\\nNotice: In progress or past events cannot be withdrawn.\\nMust be handled via Cancellation Process."]
    CheckDate -- "No (Future event)" --> ShowButton["Officer clicks 'Withdraw Permit' button"]
    
    ShowButton --> OpenModal["System opens 'Withdraw Permit' dialog\\nPrompts officer for mandatory reason"]
    OpenModal --> InputReason["Officer types reason for withdrawal\\n(Up to 500 characters)"]
    
    InputReason --> ValidateInput{"Is reason provided?\\n(1 to 500 characters)"}
    ValidateInput -- "No / Empty" --> ShowValidation["Display error message:\\n'Reason is required'"] --> InputReason
    ValidateInput -- "Exceeds 500 chars" --> ShowLengthError["Display character limit warning"] --> InputReason
    
    ValidateInput -- "Yes (Valid)" --> ConfirmAction["Officer reviews and clicks\\n'Confirm Withdrawal'"]
    ConfirmAction --> ProcessWithdraw["System marks permit as WITHDRAWN\\nand records reason in history"]
    
    ProcessWithdraw --> SuccessBanner["Display confirmation banner:\\n'Permit successfully withdrawn. Hall released.'"]
    SuccessBanner --> RefreshView["Permit status updates to WITHDRAWN\\nAudit log displays withdrawal entry\\nWithdraw button disabled"]
    RefreshView --> EndState(["Permit view updated"])
```

### Key Business Decisions Displayed to Officers:
1. **Unstarted Bookings Only:** Only permits whose events have not yet commenced can be withdrawn. If the date has passed or the event is underway, it must follow the Cancellation procedure.
2. **Mandatory Audit Reason:** Council regulations require an official explanation (e.g. holder requested, illness, severe weather) up to 500 characters.
3. **No Financial Refund in this System:** Withdrawal releases the facility reservation. If a refund is due, it is issued by Council Finance through their separate accounting portal.
"""
    (out_dir / "1a-business-flowchart.md").write_text(doc_1a, encoding="utf-8")

    # 1b. Technical Flowchart (Engineering: components, endpoints, database transactions, HTTP statuses)
    doc_1b = """# Artifact 1b — Technical Flowchart: RC-4 (Withdraw a Permit)

> **Audience:** System architects, backend engineers, and AI code generation agents.

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Council Staff (Browser)
    participant UI as React Frontend (PermitDetail)
    participant Controller as PermitController (Spring Boot)
    participant Service as PermitService
    participant Repo as PermitRepository / JPA
    participant DB as Relational Database (H2/Postgres)

    Officer->>UI: Clicks "Withdraw Permit"
    UI->>Officer: Displays WithdrawModal (with 500-char live counter)
    Officer->>UI: Enters reason, clicks "Confirm Withdrawal"
    
    UI->>Controller: POST /api/permits/{id}/withdraw<br/>{"reason": "Holder requested refund"}
    
    alt Permit does not exist
        Controller->>Service: withdrawPermit(id, request)
        Service->>Repo: findById(id)
        Repo-->>Service: Optional.empty
        Service-->>Controller: throw ResourceNotFoundException
        Controller-->>UI: 404 NOT_FOUND {"error": "NOT_FOUND", "message": "Permit not found"}
        UI-->>Officer: Displays error toast
    else Permit already WITHDRAWN (Terminal state)
        Service->>Service: Check status == WITHDRAWN
        Service-->>Controller: throw IneligibleStatusException
        Controller-->>UI: 409 CONFLICT {"error": "WRONG_STATUS", "message": "Already withdrawn"}
        UI-->>Officer: Displays warning modal
    else Event already started (startDate <= LocalDate.now())
        Service->>Service: Check !startDate.isAfter(LocalDate.now())
        Service-->>Controller: throw InvalidDateException
        Controller-->>UI: 400 BAD_REQUEST {"error": "PERMIT_ALREADY_STARTED", "message": "Cannot withdraw started permit"}
        UI-->>Officer: Displays policy rejection banner
    else Reason empty or > 500 characters
        Controller-->>UI: 400 BAD_REQUEST {"error": "VALIDATION_FAILED", "message": "Reason must be 1-500 chars"}
        UI-->>Officer: Displays field validation error
    else All validations pass (Happy path)
        Service->>Repo: Update permit status = WITHDRAWN, updated_at = now()
        Service->>Repo: Insert permit_history(action='WITHDRAWN', detail=reason, performed_by='system')
        Repo->>DB: Atomic COMMIT Transaction
        DB-->>Repo: Success
        Service-->>Controller: Return updated PermitDetailDto
        Controller-->>UI: 200 OK (PermitDetailDto with status WITHDRAWN)
        UI-->>Officer: Closes modal, shows success notification, renders updated audit trail
    end
```
"""
    (out_dir / "1b-technical-flowchart.md").write_text(doc_1b, encoding="utf-8")

    # 1c. Functional Document (Client contract, acceptance criteria, RTM)
    doc_1c = """# Artifact 1c — Functional Document: RC-4 (Withdraw a Permit)

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
"""
    (out_dir / "1c-functional-document.md").write_text(doc_1c, encoding="utf-8")

    # 1d. Technical Document (Implementation contracts, schemas, DTOs, HTTP codes)
    doc_1d = """# Artifact 1d — Technical Document: RC-4 (Withdraw a Permit)

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
"""
    (out_dir / "1d-technical-document.md").write_text(doc_1d, encoding="utf-8")
    print(f"[GENERATOR] Generated 4 artifacts in {out_dir}")

def generate_backend_code(base_dir: Path):
    backend_src = base_dir / "backend" / "src" / "main" / "java" / "uk" / "gov" / "riverside" / "permits"
    dto_dir = backend_src / "api" / "dto"
    dto_dir.mkdir(parents=True, exist_ok=True)

    # 1. WithdrawPermitRequest DTO
    withdraw_dto = """package uk.gov.riverside.permits.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Requirement: FR-20, BR-12
 */
public record WithdrawPermitRequest(
        @NotBlank(message = "Withdrawal reason is mandatory")
        @Size(max = 500, message = "Withdrawal reason cannot exceed 500 characters")
        String reason
) {}
"""
    (dto_dir / "WithdrawPermitRequest.java").write_text(withdraw_dto, encoding="utf-8")

    # 2. Update PermitService.java to add withdrawPermit method
    service_file = backend_src / "domain" / "service" / "PermitService.java"
    service_content = service_file.read_text(encoding="utf-8")

    if "withdrawPermit(" not in service_content:
        # Add import for WithdrawPermitRequest if needed
        import_stmt = "import uk.gov.riverside.permits.api.dto.WithdrawPermitRequest;\n"
        if "import uk.gov.riverside.permits.api.dto.WithdrawPermitRequest;" not in service_content:
            service_content = service_content.replace(
                "import uk.gov.riverside.permits.api.dto.RenewalRequest;",
                "import uk.gov.riverside.permits.api.dto.RenewalRequest;\n" + import_stmt
            )

        # Inject withdrawPermit method before closing brace
        withdraw_method = """
    /**
     * Requirement: FR-19, FR-20, FR-21, FR-22, FR-23, FR-24
     * Business Rules: BR-11, BR-12, BR-13, BR-14, BR-15
     */
    @Transactional
    public PermitDetailDto withdrawPermit(Long id, WithdrawPermitRequest request) {
        PermitEntity permit = permitRepository.findByIdWithHallAndPurpose(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit with id " + id + " not found"));

        if (permit.getStatus() == PermitStatus.WITHDRAWN) {
            throw new IneligibleStatusException("Permit is already in terminal status WITHDRAWN and cannot be withdrawn again.");
        }

        LocalDate today = LocalDate.now();
        if (!permit.getStartDate().isAfter(today)) {
            throw new PermitAlreadyStartedException("Permit cannot be withdrawn because the event has already started (start date: " 
                    + permit.getStartDate() + "). In-progress or past events must be processed via cancellation.");
        }

        permit.setStatus(PermitStatus.WITHDRAWN);
        permit.setUpdatedAt(LocalDateTime.now());
        permitRepository.save(permit);

        PermitHistoryEntity history = new PermitHistoryEntity(
                permit.getId(),
                "WITHDRAWN",
                request.reason().trim(),
                "system"
        );
        permitHistoryRepository.save(history);

        return toDetailDto(permit);
    }
}
"""
        # Replace the last closing brace
        idx = service_content.rfind("}")
        service_content = service_content[:idx] + withdraw_method
        service_file.write_text(service_content, encoding="utf-8")

    # 3. Update PermitController.java to add withdraw endpoint
    controller_file = backend_src / "api" / "controller" / "PermitController.java"
    controller_content = controller_file.read_text(encoding="utf-8")

    if "withdrawPermit(" not in controller_content:
        if "import uk.gov.riverside.permits.api.dto.WithdrawPermitRequest;" not in controller_content:
            controller_content = controller_content.replace(
                "import uk.gov.riverside.permits.api.dto.RenewalRequest;",
                "import uk.gov.riverside.permits.api.dto.RenewalRequest;\nimport uk.gov.riverside.permits.api.dto.WithdrawPermitRequest;"
            )

        controller_method = """
    /**
     * Requirement: FR-19, FR-20, FR-21, FR-22, FR-23, FR-24
     * BR-11, BR-12, BR-13, BR-14, BR-15
     */
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<PermitDetailDto> withdrawPermit(
            @PathVariable Long id,
            @Valid @RequestBody WithdrawPermitRequest request) {
        PermitDetailDto updated = permitService.withdrawPermit(id, request);
        return ResponseEntity.ok(updated);
    }
}
"""
        idx = controller_content.rfind("}")
        controller_content = controller_content[:idx] + controller_method
        controller_file.write_text(controller_content, encoding="utf-8")

    # 4. Generate Integration Test: PermitWithdrawalIntegrationTest.java
    test_dir = base_dir / "backend" / "src" / "test" / "java" / "uk" / "gov" / "riverside" / "permits" / "api" / "controller"
    test_dir.mkdir(parents=True, exist_ok=True)

    test_content = """package uk.gov.riverside.permits.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import uk.gov.riverside.permits.domain.model.*;
import uk.gov.riverside.permits.domain.repository.HallRepository;
import uk.gov.riverside.permits.domain.repository.PermitHistoryRepository;
import uk.gov.riverside.permits.domain.repository.PermitRepository;
import uk.gov.riverside.permits.domain.repository.PurposeRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PermitWithdrawalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PermitRepository permitRepository;

    @Autowired
    private HallRepository hallRepository;

    @Autowired
    private PurposeRepository purposeRepository;

    @Autowired
    private PermitHistoryRepository historyRepository;

    private PermitEntity createFuturePermit(String number, PermitStatus status, int startDaysInFuture) {
        HallEntity hall = hallRepository.findAll().get(0);
        PurposeEntity purpose = purposeRepository.findAll().get(0);

        PermitEntity permit = new PermitEntity(
                number,
                "Test Holder",
                hall,
                purpose,
                status,
                LocalDate.now().plusDays(startDaysInFuture),
                LocalDate.now().plusDays(startDaysInFuture + 5),
                new BigDecimal("500.00")
        );
        return permitRepository.save(permit);
    }

    /**
     * Requirement: FR-19, FR-22, FR-23, BR-11, BR-5, BR-15
     */
    @Test
    @DisplayName("FR-19 & FR-22 & FR-23: Successfully withdraw eligible future permit with audit log")
    void shouldWithdrawEligiblePermit() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W01", PermitStatus.ACTIVE, 10);
        String jsonPayload = \"\"\"
                {
                  "reason": "Holder cancelled event due to bad weather."
                }
                \"\"\";

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));

        PermitEntity updated = permitRepository.findById(permit.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(PermitStatus.WITHDRAWN);

        List<PermitHistoryEntity> history = historyRepository.findByPermitIdOrderByPerformedAtDesc(permit.getId());
        assertThat(history).isNotEmpty();
        assertThat(history.get(0).getAction()).isEqualTo("WITHDRAWN");
        assertThat(history.get(0).getDetail()).isEqualTo("Holder cancelled event due to bad weather.");
    }

    /**
     * Requirement: FR-20, BR-12
     */
    @Test
    @DisplayName("FR-20: Reject withdrawal when reason is blank")
    void shouldRejectBlankReason() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W02", PermitStatus.ACTIVE, 5);
        String jsonPayload = \"\"\"
                {
                  "reason": "   "
                }
                \"\"\";

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
    }

    /**
     * Requirement: FR-20, BR-12
     */
    @Test
    @DisplayName("FR-20: Reject withdrawal when reason exceeds 500 characters")
    void shouldRejectReasonExceeding500Chars() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W03", PermitStatus.ACTIVE, 5);
        String longReason = "a".repeat(501);
        String jsonPayload = String.format("{\\"reason\\": \\"%s\\"}", longReason);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
    }

    /**
     * Requirement: FR-21, BR-13
     */
    @Test
    @DisplayName("FR-21: Reject withdrawal if permit event has already started (today or in the past)")
    void shouldRejectWithdrawalIfPermitAlreadyStarted() throws Exception {
        HallEntity hall = hallRepository.findAll().get(0);
        PurposeEntity purpose = purposeRepository.findAll().get(0);
        PermitEntity permit = permitRepository.save(new PermitEntity(
                "P-TEST-W04",
                "Started Holder",
                hall,
                purpose,
                PermitStatus.ACTIVE,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(5),
                new BigDecimal("600.00")
        ));

        String jsonPayload = \"\"\"
                {
                  "reason": "Try to withdraw ongoing event"
                }
                \"\"\";

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already started")));
    }

    /**
     * Requirement: FR-24, BR-14
     */
    @Test
    @DisplayName("FR-24: Reject withdrawal if permit is already in WITHDRAWN terminal status")
    void shouldRejectWithdrawalIfAlreadyWithdrawn() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W05", PermitStatus.WITHDRAWN, 5);
        String jsonPayload = \"\"\"
                {
                  "reason": "Attempt second withdrawal"
                }
                \"\"\";

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already in terminal status WITHDRAWN")));
    }
}
"""
    (test_dir / "PermitWithdrawalIntegrationTest.java").write_text(test_content, encoding="utf-8")
    print(f"[GENERATOR] Generated backend code, DTO, endpoints, and 5 unit/integration tests")

def generate_frontend_code(base_dir: Path):
    fe_dir = base_dir / "frontend" / "src"

    # 1. Update api.ts to include withdrawPermit
    api_file = fe_dir / "services" / "api.ts"
    api_content = api_file.read_text(encoding="utf-8")

    if "withdrawPermit(" not in api_content:
        withdraw_api_method = """
  async withdrawPermit(id: number, reason: string): Promise<PermitDetail> {
    const res = await fetch(`${API_BASE}/permits/${id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to withdraw permit (${res.status})`);
    }
    return res.json();
  },
};
"""
        idx = api_content.rfind("};")
        api_content = api_content[:idx] + withdraw_api_method
        api_file.write_text(api_content, encoding="utf-8")

    # 2. Create WithdrawModal.tsx
    withdraw_modal_code = """import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { PermitDetail } from '../types/permit';
import { api } from '../services/api';

interface WithdrawModalProps {
  permit: PermitDetail;
  onClose: () => void;
  onSuccess: (updated: PermitDetail) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ permit, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = reason.length;
  const isTooLong = charCount > 500;
  const isValid = reason.trim().length > 0 && !isTooLong;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await api.withdrawPermit(permit.id, reason.trim());
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw permit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Withdraw Permit: {permit.permitNumber}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <p className="font-medium">Important Municipal Policy:</p>
            <p>
              Withdrawing this permit immediately releases the facility reservation. 
              <strong> Refunds are not processed by this system</strong> and must be coordinated through Council Finance.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason provided by the holder or council authority (e.g. holder relocation, cancellation request)..."
              className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isTooLong ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
              }`}
            />
            <div className="flex justify-between items-center text-xs mt-1">
              <span className={isTooLong ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                {charCount}/500 characters
              </span>
              {isTooLong && <span className="text-red-600">Exceeds 500-character limit</span>}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="px-4 py-2 rounded text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
"""
    (fe_dir / "components" / "WithdrawModal.tsx").write_text(withdraw_modal_code, encoding="utf-8")

    # 3. Update PermitDetail.tsx to add Withdraw Button and Modal launcher
    detail_file = fe_dir / "components" / "PermitDetail.tsx"
    detail_content = detail_file.read_text(encoding="utf-8")

    if "WithdrawModal" not in detail_content:
        # Add import
        detail_content = detail_content.replace(
            "import { RenewalModal } from './RenewalModal';",
            "import { RenewalModal } from './RenewalModal';\nimport { WithdrawModal } from './WithdrawModal';"
        )
        # Add state
        detail_content = detail_content.replace(
            "const [isRenewOpen, setIsRenewOpen] = useState(false);",
            "const [isRenewOpen, setIsRenewOpen] = useState(false);\n  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);"
        )

        # Check eligibility for withdrawal: status != WITHDRAWN and startDate > today
        # Add withdrawal button next to Renew button
        renew_button_marker = "{isEligibleForRenewal ? ("
        if renew_button_marker in detail_content:
            withdraw_button_snippet = """
          {/* RC-4: Withdraw Action */}
          {permit.status !== 'WITHDRAWN' && new Date(permit.startDate) > new Date() && (
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-white text-red-700 border border-red-300 hover:bg-red-50 transition-colors"
            >
              Withdraw Permit
            </button>
          )}
"""
            detail_content = detail_content.replace(renew_button_marker, withdraw_button_snippet + "\n          " + renew_button_marker)

        # Add modal rendering before closing div
        modal_render_marker = "{isRenewOpen && ("
        if modal_render_marker in detail_content:
            withdraw_modal_render = """
      {isWithdrawOpen && (
        <WithdrawModal
          permit={permit}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={(updated) => {
            setIsWithdrawOpen(false);
            setPermit(updated);
          }}
        />
      )}
"""
            detail_content = detail_content.replace(modal_render_marker, withdraw_modal_render + "\n      " + modal_render_marker)

        detail_file.write_text(detail_content, encoding="utf-8")

    print(f"[GENERATOR] Generated frontend WithdrawModal and wired into PermitDetail")

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    reconciled_path = base_dir / "pipeline" / "reconciled_rc4.json"
    if reconciled_path.exists():
        spec = json.loads(reconciled_path.read_text(encoding="utf-8"))
    else:
        from reconciler import reconcile_rc4
        spec = reconcile_rc4(base_dir / "test" / "requirement" / "stories.md", base_dir / "test" / "requirement" / "clarifications.md")

    generate_artifacts(base_dir, spec)
    generate_backend_code(base_dir)
    generate_frontend_code(base_dir)
