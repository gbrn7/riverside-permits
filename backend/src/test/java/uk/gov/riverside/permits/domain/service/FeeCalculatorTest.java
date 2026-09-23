package uk.gov.riverside.permits.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uk.gov.riverside.permits.domain.model.HallEntity;
import uk.gov.riverside.permits.domain.model.PurposeEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class FeeCalculatorTest {

    private FeeCalculator feeCalculator;
    private HallEntity riversideHall;
    private PurposeEntity communityEvent;
    private PurposeEntity councilUse;

    @BeforeEach
    void setUp() {
        feeCalculator = new FeeCalculator();
        riversideHall = new HallEntity("Riverside Community Hall", "Riverside", new BigDecimal("120.00"), true);
        communityEvent = new PurposeEntity("COMMUNITY_EVENT", "Community Event", false, true);
        councilUse = new PurposeEntity("COUNCIL_USE", "Council Use", true, true);
    }

    // Requirement: FR-14 (Fee Cap), BR-4
    @Test
    @DisplayName("should cap renewal fee at 30 days when extension exceeds 30 days")
    void shouldCapRenewalFeeAtThirtyDays() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 1);
        LocalDate newEnd = LocalDate.of(2026, 8, 1); // 61 days

        FeeCalculator.CalculationResult result = feeCalculator.calculateRenewalFee(
                currentEnd, newEnd, riversideHall, communityEvent
        );

        assertThat(result.daysAdded()).isEqualTo(61);
        assertThat(result.cappedDays()).isEqualTo(30);
        assertThat(result.isCapped()).isTrue();
        // 30 days * 120.00 = 3600.00
        assertThat(result.fee()).isEqualByComparingTo(new BigDecimal("3600.00"));
    }

    // Requirement: FR-14, BR-4
    @Test
    @DisplayName("should calculate standard renewal fee when extension is less than 30 days")
    void shouldCalculateStandardRenewalFeeUnderCap() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 1);
        LocalDate newEnd = LocalDate.of(2026, 6, 11); // 10 days

        FeeCalculator.CalculationResult result = feeCalculator.calculateRenewalFee(
                currentEnd, newEnd, riversideHall, communityEvent
        );

        assertThat(result.daysAdded()).isEqualTo(10);
        assertThat(result.cappedDays()).isEqualTo(10);
        assertThat(result.isCapped()).isFalse();
        // 10 days * 120.00 = 1200.00
        assertThat(result.fee()).isEqualByComparingTo(new BigDecimal("1200.00"));
    }

    // Requirement: FR-15 (Council Use Exemption), BR-4
    @Test
    @DisplayName("should charge £0.00 renewal fee for Council Use bookings regardless of duration")
    void shouldChargeZeroForCouncilUseBookings() {
        LocalDate currentEnd = LocalDate.of(2026, 6, 1);
        LocalDate newEnd = LocalDate.of(2026, 9, 1); // 92 days

        FeeCalculator.CalculationResult result = feeCalculator.calculateRenewalFee(
                currentEnd, newEnd, riversideHall, councilUse
        );

        assertThat(result.isCouncilUse()).isTrue();
        assertThat(result.fee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.isCapped()).isFalse();
    }
}
