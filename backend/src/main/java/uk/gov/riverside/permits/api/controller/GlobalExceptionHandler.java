package uk.gov.riverside.permits.api.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import uk.gov.riverside.permits.api.dto.ApiErrorResponse;
import uk.gov.riverside.permits.domain.exception.ExpiredTooLongException;
import uk.gov.riverside.permits.domain.exception.IneligibleStatusException;
import uk.gov.riverside.permits.domain.exception.InvalidEndDateException;
import uk.gov.riverside.permits.domain.exception.PermitAlreadyStartedException;
import uk.gov.riverside.permits.domain.exception.ResourceNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidEndDateException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidEndDate(InvalidEndDateException ex) {
        log.warn("Invalid end date: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("INVALID_END_DATE", ex.getMessage()));
    }

    @ExceptionHandler(IneligibleStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleIneligibleStatus(IneligibleStatusException ex) {
        log.warn("Ineligible status: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiErrorResponse("WRONG_STATUS", ex.getMessage()));
    }

    @ExceptionHandler(ExpiredTooLongException.class)
    public ResponseEntity<ApiErrorResponse> handleExpiredTooLong(ExpiredTooLongException ex) {
        log.warn("Expired too long: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiErrorResponse("EXPIRED_TOO_LONG", ex.getMessage()));
    }

    @ExceptionHandler(PermitAlreadyStartedException.class)
    public ResponseEntity<ApiErrorResponse> handlePermitAlreadyStarted(PermitAlreadyStartedException ex) {
        log.warn("Permit already started: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("PERMIT_ALREADY_STARTED", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponse("VALIDATION_FAILED", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again."));
    }
}
