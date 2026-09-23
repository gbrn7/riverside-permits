package uk.gov.riverside.permits.api.dto;

import uk.gov.riverside.permits.domain.model.PermitStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PermitDetailDto(
    Long id,
    String permitNumber,
    String holderName,
    Long hallId,
    String hallName,
    Long purposeId,
    String purposeName,
    Boolean isCouncilUse,
    PermitStatus status,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal fee,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<RenewalRecordDto> renewalHistory,
    List<PermitHistoryDto> history
) {}
