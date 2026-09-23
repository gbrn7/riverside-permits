package uk.gov.riverside.permits.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uk.gov.riverside.permits.domain.exception.ExpiredTooLongException;
import uk.gov.riverside.permits.domain.exception.IneligibleStatusException;
import uk.gov.riverside.permits.domain.exception.InvalidEndDateException;
import uk.gov.riverside.permits.domain.model.HallEntity;
import uk.gov.riverside.permits.domain.model.PermitEntity;
import uk.gov.riverside.permits.domain.model.PermitStatus;
import uk.gov.riverside.permits.domain.model.PurposeEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PermitEligibilityValidatorTest {

    private PermitEligibilityValidator validator;
    private HallEntity hall;
    private PurposeEntity purpose;

    @BeforeEach
    void setUp() {
        validator = new PermitEligibilityValidator();
        hall = new HallEntity("Riverside Community Hall", "Riverside", new BigDecimal("120.00"), true);
        purpose = new PurposeEntity("COMMUNITY_EVENT", "Community Event", false, true);
    }

    // Requirement: FR-12 (Date Validation), BR-3
    @Test
    @DisplayName("should reject renewal if newEndDate is not strictly after current endDate")
    void shouldRejectWhenNewEndDateNotAfterCurrent() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 14);
        PermitEntity permit = new PermitEntity("P-1", "Holder", hall, purpose,
                PermitStatus.ACTIVE, LocalDate.of(2026, 6, 1), currentEnd, BigDecimal.TEN);

        // Same date
        assertThatThrownBy(() -> validator.validateRenewalEligibility(permit, currentEnd))
                .isInstanceOf(InvalidEndDateException.class);

        // Past date
        assertThatThrownBy(() -> validator.validateRenewalEligibility(permit, currentEnd.minusDays(1)))
                .isInstanceOf(InvalidEndDateException.class);
    }

    // Requirement: FR-13 (Eligibility), BR-1
    @Test
    @DisplayName("should allow renewal for ACTIVE permits")
    void shouldAllowRenewalForActivePermits() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 14);
        PermitEntity permit = new PermitEntity("P-1", "Holder", hall, purpose,
                PermitStatus.ACTIVE, LocalDate.of(2026, 6, 1), currentEnd, BigDecimal.TEN);

        assertThatCode(() -> validator.validateRenewalEligibility(permit, currentEnd.plusDays(7)))
                .doesNotThrowAnyException();
    }

    // Requirement: FR-13 (Eligibility), BR-1, BR-2
    @Test
    @DisplayName("should allow renewal for EXPIRED permits if expired within 90 days")
    void shouldAllowRenewalForRecentlyExpiredPermits() {
        LocalDate currentEnd = LocalDate.now().minusDays(30); // 30 days ago
        PermitEntity permit = new PermitEntity("P-1", "Holder", hall, purpose,
                PermitStatus.EXPIRED, currentEnd.minusDays(10), currentEnd, BigDecimal.TEN);

        assertThatCode(() -> validator.validateRenewalEligibility(permit, LocalDate.now().plusDays(10)))
                .doesNotThrowAnyException();
    }

    // Requirement: FR-13 (Eligibility), BR-2
    @Test
    @DisplayName("should reject renewal for EXPIRED permits if expired > 90 days ago")
    void shouldRejectWhenExpiredMoreThanNinetyDays() {
        LocalDate currentEnd = LocalDate.now().minusDays(95); // 95 days ago
        PermitEntity permit = new PermitEntity("P-1", "Holder", hall, purpose,
                PermitStatus.EXPIRED, currentEnd.minusDays(10), currentEnd, BigDecimal.TEN);

        assertThatThrownBy(() -> validator.validateRenewalEligibility(permit, LocalDate.now().plusDays(10)))
                .isInstanceOf(ExpiredTooLongException.class);
    }

    // Requirement: FR-13, BR-1
    @Test
    @DisplayName("should reject renewal for ineligible statuses (AWAITING_PAYMENT, WITHDRAWN, DRAFT)")
    void shouldRejectIneligibleStatuses() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 14);
        LocalDate newEnd = currentEnd.plusDays(7);

        PermitEntity awaitingPayment = new PermitEntity("P-1", "Holder", hall, purpose,
                PermitStatus.AWAITING_PAYMENT, LocalDate.of(2026, 6, 1), currentEnd, BigDecimal.TEN);
        assertThatThrownBy(() -> validator.validateRenewalEligibility(awaitingPayment, newEnd))
                .isInstanceOf(IneligibleStatusException.class);

        PermitEntity withdrawn = new PermitEntity("P-2", "Holder", hall, purpose,
                PermitStatus.WITHDRAWN, LocalDate.of(2026, 6, 1), currentEnd, BigDecimal.TEN);
        assertThatThrownBy(() -> validator.validateRenewalEligibility(withdrawn, newEnd))
                .isInstanceOf(IneligibleStatusException.class);

        PermitEntity draft = new PermitEntity("P-3", "Holder", hall, purpose,
                PermitStatus.DRAFT, LocalDate.of(2026, 6, 1), currentEnd, BigDecimal.TEN);
        assertThatThrownBy(() -> validator.validateRenewalEligibility(draft, newEnd))
                .isInstanceOf(IneligibleStatusException.class);
    }

    // Requirement: Validation Sequence (1d §4 RC-3: status -> expired-window -> date)
    @Test
    @DisplayName("should evaluate status eligibility before date validation (fail-fast sequence)")
    void shouldPrioritizeStatusValidationOverDateValidation() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 14);
        LocalDate invalidDate = currentEnd.minusDays(5);

        PermitEntity withdrawn = new PermitEntity("P-2", "Holder", hall, purpose,
                PermitStatus.WITHDRAWN, LocalDate.of(2026, 6, 1), currentEnd, BigDecimal.TEN);

        assertThatThrownBy(() -> validator.validateRenewalEligibility(withdrawn, invalidDate))
                .isInstanceOf(IneligibleStatusException.class);
    }

    @Test
    @DisplayName("should evaluate expired > 90 days before date validation (fail-fast sequence)")
    void shouldPrioritizeExpiredTooLongOverDateValidation() {
        LocalDate currentEnd = LocalDate.now().minusDays(100);
        LocalDate invalidDate = currentEnd.minusDays(5);

        PermitEntity expiredTooLong = new PermitEntity("P-3", "Holder", hall, purpose,
                PermitStatus.EXPIRED, currentEnd.minusDays(10), currentEnd, BigDecimal.TEN);

        assertThatThrownBy(() -> validator.validateRenewalEligibility(expiredTooLong, invalidDate))
                .isInstanceOf(ExpiredTooLongException.class);
    }
}
