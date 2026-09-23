package uk.gov.riverside.permits.api.dto;

import uk.gov.riverside.permits.domain.model.PermitStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RenewalPreviewDto(
    Long permitId,
    String permitNumber,
    String hallName,
    String purposeName,
    Boolean isCouncilUse,
    LocalDate previousEndDate,
    LocalDate newEndDate,
    long daysAdded,
    long cappedDays,
    BigDecimal dailyRate,
    BigDecimal calculatedFee,
    boolean isCapped,
    PermitStatus resultingStatus
) {}
