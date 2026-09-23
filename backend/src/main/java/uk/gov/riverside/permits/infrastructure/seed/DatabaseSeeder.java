package uk.gov.riverside.permits.infrastructure.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uk.gov.riverside.permits.domain.model.HallEntity;
import uk.gov.riverside.permits.domain.model.PermitEntity;
import uk.gov.riverside.permits.domain.model.PermitStatus;
import uk.gov.riverside.permits.domain.model.PurposeEntity;
import uk.gov.riverside.permits.domain.repository.HallRepository;
import uk.gov.riverside.permits.domain.repository.PermitRepository;
import uk.gov.riverside.permits.domain.repository.PurposeRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final HallRepository hallRepository;
    private final PurposeRepository purposeRepository;
    private final PermitRepository permitRepository;

    public DatabaseSeeder(HallRepository hallRepository,
                          PurposeRepository purposeRepository,
                          PermitRepository permitRepository) {
        this.hallRepository = hallRepository;
        this.purposeRepository = purposeRepository;
        this.permitRepository = permitRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (hallRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial seeding.");
            return;
        }

        log.info("Seeding Reference Data and Sample Permits...");

        // 1. Seed Halls (Section 3.1)
        HallEntity riversideHall = hallRepository.save(new HallEntity("Riverside Community Hall", "Riverside", new BigDecimal("120.00"), true));
        HallEntity eastgatePavilion = hallRepository.save(new HallEntity("Eastgate Pavilion", "Eastgate", new BigDecimal("95.00"), true));
        HallEntity northbrookRoom = hallRepository.save(new HallEntity("Northbrook Function Room", "Northbrook", new BigDecimal("80.00"), true));
        HallEntity southbankAssembly = hallRepository.save(new HallEntity("Southbank Assembly Hall", "Southbank", new BigDecimal("150.00"), true));

        // 2. Seed Purposes (Section 3.2)
        PurposeEntity communityEvent = purposeRepository.save(new PurposeEntity("COMMUNITY_EVENT", "Community Event", false, true));
        PurposeEntity religiousService = purposeRepository.save(new PurposeEntity("RELIGIOUS_SERVICE", "Religious Service", false, true));
        PurposeEntity privateFunction = purposeRepository.save(new PurposeEntity("PRIVATE_FUNCTION", "Private Function", false, true));
        PurposeEntity commercialUse = purposeRepository.save(new PurposeEntity("COMMERCIAL_USE", "Commercial Use", false, true));
        PurposeEntity councilUse = purposeRepository.save(new PurposeEntity("COUNCIL_USE", "Council Use", true, true));

        // 3. Seed Permits from Sample Data (Section 3.3)
        List<PermitEntity> samplePermits = List.of(
            // P-2026-0001: Amelia Tan, ACTIVE, 14 days
            new PermitEntity("P-2026-0001", "Amelia Tan", riversideHall, communityEvent,
                PermitStatus.ACTIVE, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 14), new BigDecimal("1680.00")),

            // P-2026-0002: Grace Fellowship, ACTIVE, 30 days
            new PermitEntity("P-2026-0002", "Grace Fellowship", eastgatePavilion, religiousService,
                PermitStatus.ACTIVE, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 7, 4), new BigDecimal("2850.00")),

            // P-2026-0003: Devi Ramasamy, EXPIRED > 90 days ago (Demonstrates 409 EXPIRED_TOO_LONG)
            new PermitEntity("P-2026-0003", "Devi Ramasamy", northbrookRoom, privateFunction,
                PermitStatus.EXPIRED, LocalDate.of(2025, 11, 1), LocalDate.of(2025, 11, 7), new BigDecimal("560.00")),

            // P-2026-0004: Northbrook Yoga Co., ACTIVE, 14 days
            new PermitEntity("P-2026-0004", "Northbrook Yoga Co.", northbrookRoom, commercialUse,
                PermitStatus.ACTIVE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 24), new BigDecimal("1120.00")),

            // P-2026-0006: Marcus Oyelaran, AWAITING_PAYMENT, 2 days (Cannot be renewed)
            new PermitEntity("P-2026-0006", "Marcus Oyelaran", southbankAssembly, privateFunction,
                PermitStatus.AWAITING_PAYMENT, LocalDate.of(2026, 6, 20), LocalDate.of(2026, 6, 21), new BigDecimal("300.00")),

            // P-2026-0008: Priya Nair, WITHDRAWN, 2 days (Terminal state)
            new PermitEntity("P-2026-0008", "Priya Nair", riversideHall, privateFunction,
                PermitStatus.WITHDRAWN, LocalDate.of(2026, 5, 20), LocalDate.of(2026, 5, 22), new BigDecimal("360.00")),

            // P-2026-0009: Southbank Arts Trust, EXPIRED
            new PermitEntity("P-2026-0009", "Southbank Arts Trust", southbankAssembly, communityEvent,
                PermitStatus.EXPIRED, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 10), new BigDecimal("1500.00")),

            // 4. Additional Edge-Case Seeds (Section 3.4)
            // P-2026-0010: Council Use free renewal (ACTIVE -> stays ACTIVE, fee £0.00)
            new PermitEntity("P-2026-0010", "Riverside Parks Dept", riversideHall, councilUse,
                PermitStatus.ACTIVE, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3), BigDecimal.ZERO),

            // P-2026-0011: Eastgate Drama Club, EXPIRED ~45 days ago (Within 90 days -> eligible for renewal)
            new PermitEntity("P-2026-0011", "Eastgate Drama Club", eastgatePavilion, communityEvent,
                PermitStatus.EXPIRED, LocalDate.now().minusDays(51), LocalDate.now().minusDays(45), new BigDecimal("570.00"))
        );

        permitRepository.saveAll(samplePermits);
        log.info("Database seeding complete. {} permits loaded.", samplePermits.size());
    }
}
