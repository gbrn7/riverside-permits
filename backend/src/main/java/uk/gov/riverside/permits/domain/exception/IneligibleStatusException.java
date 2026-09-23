package uk.gov.riverside.permits.domain.exception;

import uk.gov.riverside.permits.domain.model.PermitStatus;

public class IneligibleStatusException extends RuntimeException {
    public IneligibleStatusException(String message) {
        super(message);
    }

    public IneligibleStatusException(PermitStatus status) {
        super(String.format("Permit with status %s cannot be renewed. Only ACTIVE permits or EXPIRED permits within 90 days are eligible.", status));
    }
}
