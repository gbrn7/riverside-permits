package uk.gov.riverside.permits.api.dto;

import java.math.BigDecimal;

public record HallDto(
    Long id,
    String name,
    String district,
    BigDecimal dailyRate
) {}
