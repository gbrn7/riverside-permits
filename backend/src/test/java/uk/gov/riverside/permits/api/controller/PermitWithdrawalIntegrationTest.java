package uk.gov.riverside.permits.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import uk.gov.riverside.permits.domain.model.*;
import uk.gov.riverside.permits.domain.repository.HallRepository;
import uk.gov.riverside.permits.domain.repository.PermitHistoryRepository;
import uk.gov.riverside.permits.domain.repository.PermitRepository;
import uk.gov.riverside.permits.domain.repository.PurposeRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PermitWithdrawalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PermitRepository permitRepository;

    @Autowired
    private HallRepository hallRepository;

    @Autowired
    private PurposeRepository purposeRepository;

    @Autowired
    private PermitHistoryRepository historyRepository;

    private PermitEntity createFuturePermit(String number, PermitStatus status, int startDaysInFuture) {
        HallEntity hall = hallRepository.findAll().get(0);
        PurposeEntity purpose = purposeRepository.findAll().get(0);

        PermitEntity permit = new PermitEntity(
                number,
                "Test Holder",
                hall,
                purpose,
                status,
                LocalDate.now().plusDays(startDaysInFuture),
                LocalDate.now().plusDays(startDaysInFuture + 5),
                new BigDecimal("500.00")
        );
        return permitRepository.save(permit);
    }

    /**
     * Requirement: FR-19, FR-22, FR-23, BR-11, BR-5, BR-15
     */
    @Test
    @DisplayName("FR-19 & FR-22 & FR-23: Successfully withdraw eligible future permit with audit log")
    void shouldWithdrawEligiblePermit() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W01", PermitStatus.ACTIVE, 10);
        String jsonPayload = """
                {
                  "reason": "Holder cancelled event due to bad weather."
                }
                """;

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));

        PermitEntity updated = permitRepository.findById(permit.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(PermitStatus.WITHDRAWN);

        List<PermitHistoryEntity> history = historyRepository.findByPermitIdOrderByPerformedAtDesc(permit.getId());
        assertThat(history).isNotEmpty();
        assertThat(history.get(0).getAction()).isEqualTo("WITHDRAWN");
        assertThat(history.get(0).getDetail()).isEqualTo("Holder cancelled event due to bad weather.");
    }

    /**
     * Requirement: FR-20, BR-12
     */
    @Test
    @DisplayName("FR-20: Reject withdrawal when reason is blank")
    void shouldRejectBlankReason() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W02", PermitStatus.ACTIVE, 5);
        String jsonPayload = """
                {
                  "reason": "   "
                }
                """;

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
    }

    /**
     * Requirement: FR-20, BR-12
     */
    @Test
    @DisplayName("FR-20: Reject withdrawal when reason exceeds 500 characters")
    void shouldRejectReasonExceeding500Chars() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W03", PermitStatus.ACTIVE, 5);
        String longReason = "a".repeat(501);
        String jsonPayload = String.format("{\"reason\": \"%s\"}", longReason);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
    }

    /**
     * Requirement: FR-21, BR-13
     */
    @Test
    @DisplayName("FR-21: Reject withdrawal if permit event has already started (today or in the past)")
    void shouldRejectWithdrawalIfPermitAlreadyStarted() throws Exception {
        HallEntity hall = hallRepository.findAll().get(0);
        PurposeEntity purpose = purposeRepository.findAll().get(0);
        PermitEntity permit = permitRepository.save(new PermitEntity(
                "P-TEST-W04",
                "Started Holder",
                hall,
                purpose,
                PermitStatus.ACTIVE,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(5),
                new BigDecimal("600.00")
        ));

        String jsonPayload = """
                {
                  "reason": "Try to withdraw ongoing event"
                }
                """;

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("already started")));
    }

    /**
     * Requirement: FR-24, BR-14
     */
    @Test
    @DisplayName("FR-24: Reject withdrawal if permit is already in WITHDRAWN terminal status")
    void shouldRejectWithdrawalIfAlreadyWithdrawn() throws Exception {
        PermitEntity permit = createFuturePermit("P-TEST-W05", PermitStatus.WITHDRAWN, 5);
        String jsonPayload = """
                {
                  "reason": "Attempt second withdrawal"
                }
                """;

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already in terminal status WITHDRAWN")));
    }
}
