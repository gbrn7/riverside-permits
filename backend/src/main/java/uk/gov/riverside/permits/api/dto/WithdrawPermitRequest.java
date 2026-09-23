package uk.gov.riverside.permits.api.dto;

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
