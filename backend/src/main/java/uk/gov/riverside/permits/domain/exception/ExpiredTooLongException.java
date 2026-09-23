package uk.gov.riverside.permits.domain.exception;

public class ExpiredTooLongException extends RuntimeException {
    public ExpiredTooLongException(long expiredDaysAgo, long maxAllowedDays) {
        super(String.format("Permit expired %d days ago, which exceeds the statutory %d-day grace period. A new permit application must be submitted.", expiredDaysAgo, maxAllowedDays));
    }
}
