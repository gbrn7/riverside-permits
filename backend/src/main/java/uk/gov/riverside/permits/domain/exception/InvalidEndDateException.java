package uk.gov.riverside.permits.domain.exception;

import java.time.LocalDate;

public class InvalidEndDateException extends RuntimeException {
    public InvalidEndDateException(LocalDate currentEndDate, LocalDate newEndDate) {
        super(String.format("newEndDate (%s) must be strictly after current endDate (%s)", newEndDate, currentEndDate));
    }
}
