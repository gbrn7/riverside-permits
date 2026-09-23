package uk.gov.riverside.permits.domain.service;

import org.springframework.stereotype.Service;
import uk.gov.riverside.permits.domain.exception.ExpiredTooLongException;
import uk.gov.riverside.permits.domain.exception.IneligibleStatusException;
import uk.gov.riverside.permits.domain.exception.InvalidEndDateException;
import uk.gov.riverside.permits.domain.model.PermitEntity;
import uk.gov.riverside.permits.domain.model.PermitStatus;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Requirement: FR-12 (Date Validation), FR-13 (Renewal Eligibility), BR-1, BR-2, BR-3
 */
@Service
public class PermitEligibilityValidator {

    public static final int MAX_EXPIRED_CALENDAR_DAYS = 90;

    public void validateRenewalEligibility(PermitEntity permit, LocalDate newEndDate) {
        // Step 1 (BR-1): Status Eligibility (ACTIVE or EXPIRED only)
        PermitStatus status = permit.getStatus();
        if (status != PermitStatus.ACTIVE && status != PermitStatus.EXPIRED) {
            throw new IneligibleStatusException(status);
        }

        // Step 2 (BR-2): 90-Day Expired Window
        if (status == PermitStatus.EXPIRED) {
            long expiredDaysAgo = ChronoUnit.DAYS.between(permit.getEndDate(), LocalDate.now());
            if (expiredDaysAgo > MAX_EXPIRED_CALENDAR_DAYS) {
                throw new ExpiredTooLongException(expiredDaysAgo, MAX_EXPIRED_CALENDAR_DAYS);
            }
        }

        // Step 3 (BR-3): Date Validation
        if (newEndDate == null || !newEndDate.isAfter(permit.getEndDate())) {
            throw new InvalidEndDateException(permit.getEndDate(), newEndDate);
        }
    }
}
