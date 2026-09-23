package uk.gov.riverside.permits.domain.service;

import org.springframework.stereotype.Service;
import uk.gov.riverside.permits.domain.model.HallEntity;
import uk.gov.riverside.permits.domain.model.PurposeEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Requirement: FR-14 (Fee Cap), FR-15 (Council Use Exemption), BR-4
 */
@Service
public class FeeCalculator {

    public static final int STATUTORY_FEE_CAP_DAYS = 30;

    public record CalculationResult(
        long daysAdded,
        long cappedDays,
        BigDecimal dailyRate,
        BigDecimal fee,
        boolean isCapped,
        boolean isCouncilUse
    ) {}

    public CalculationResult calculateRenewalFee(LocalDate currentEndDate, LocalDate newEndDate, HallEntity hall, PurposeEntity purpose) {
        long daysAdded = ChronoUnit.DAYS.between(currentEndDate, newEndDate);
        long cappedDays = Math.min(daysAdded, STATUTORY_FEE_CAP_DAYS);
        boolean isCouncilUse = Boolean.TRUE.equals(purpose.getIsCouncilUse());

        BigDecimal dailyRate = hall.getDailyRate();
        BigDecimal fee;
        boolean isCapped = false;

        if (isCouncilUse) {
            fee = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            fee = BigDecimal.valueOf(cappedDays)
                    .multiply(dailyRate)
                    .setScale(2, RoundingMode.HALF_UP);
            isCapped = daysAdded > STATUTORY_FEE_CAP_DAYS;
        }

        return new CalculationResult(daysAdded, cappedDays, dailyRate, fee, isCapped, isCouncilUse);
    }
}
