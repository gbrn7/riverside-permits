package uk.gov.riverside.permits.api.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uk.gov.riverside.permits.api.dto.*;
import uk.gov.riverside.permits.domain.model.PermitStatus;
import uk.gov.riverside.permits.domain.service.PermitService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/permits")
@CrossOrigin(origins = "*")
public class PermitController {

    private final PermitService permitService;

    public PermitController(PermitService permitService) {
        this.permitService = permitService;
    }

    /**
     * RC-1: Search Permits
     */
    @GetMapping
    public ResponseEntity<PageResponse<PermitSummaryDto>> searchPermits(
            @RequestParam(required = false) String permitNumber,
            @RequestParam(required = false) String holderName,
            @RequestParam(required = false) Long hallId,
            @RequestParam(required = false) Long purposeId,
            @RequestParam(required = false) PermitStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PermitSummaryDto> response = permitService.searchPermits(
                permitNumber, holderName, hallId, purposeId, status, startDateFrom, startDateTo, page, size
        );
        return ResponseEntity.ok(response);
    }

    /**
     * RC-2: View a Permit
     */
    @GetMapping("/{id}")
    public ResponseEntity<PermitDetailDto> getPermit(@PathVariable Long id) {
        PermitDetailDto response = permitService.getPermitDetail(id);
        return ResponseEntity.ok(response);
    }

    /**
     * RC-3: Preview Renewal
     */
    @PostMapping("/{id}/renewals/preview")
    public ResponseEntity<RenewalPreviewDto> previewRenewal(
            @PathVariable Long id,
            @Valid @RequestBody RenewalRequest request) {

        RenewalPreviewDto response = permitService.previewRenewal(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * RC-3: Commit Renewal
     */
    @PostMapping("/{id}/renewals")
    public ResponseEntity<PermitDetailDto> commitRenewal(
            @PathVariable Long id,
            @Valid @RequestBody RenewalRequest request) {

        PermitDetailDto response = permitService.commitRenewal(id, request);
        return ResponseEntity.ok(response);
    }

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
