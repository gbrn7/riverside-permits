package uk.gov.riverside.permits.api.dto;

import java.time.LocalDateTime;

public record PermitHistoryDto(
    String action,
    String detail,
    LocalDateTime performedAt
) {}
