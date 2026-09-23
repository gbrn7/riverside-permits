package uk.gov.riverside.permits.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record RenewalRequest(
    @NotNull(message = "newEndDate is required")
    LocalDate newEndDate
) {}
