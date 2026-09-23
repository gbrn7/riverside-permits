package uk.gov.riverside.permits.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RenewalRecordDto(
    Long id,
    LocalDate previousEndDate,
    LocalDate newEndDate,
    BigDecimal fee,
    LocalDateTime performedAt
) {}
