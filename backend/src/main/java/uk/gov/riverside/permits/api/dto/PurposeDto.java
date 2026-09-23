package uk.gov.riverside.permits.api.dto;

public record PurposeDto(
    Long id,
    String code,
    String name,
    Boolean isCouncilUse
) {}
