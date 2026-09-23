package uk.gov.riverside.permits.domain.exception;

public class PermitAlreadyStartedException extends RuntimeException {
    public PermitAlreadyStartedException(String message) {
        super(message);
    }
}
