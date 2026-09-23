package uk.gov.riverside.permits.api.dto;

import uk.gov.riverside.permits.domain.model.PermitStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PermitSummaryDto(
    Long id,
    String permitNumber,
    String holderName,
    String hallName,
    String purposeName,
    PermitStatus status,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal fee
) {}
