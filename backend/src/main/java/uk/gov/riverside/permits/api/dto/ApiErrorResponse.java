package uk.gov.riverside.permits.api.dto;

import java.time.LocalDateTime;

public record ApiErrorResponse(
    String error,
    String message,
    LocalDateTime timestamp
) {
    public ApiErrorResponse(String error, String message) {
        this(error, message, LocalDateTime.now());
    }
}
