package uk.gov.riverside.permits.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import uk.gov.riverside.permits.domain.model.PermitEntity;
import uk.gov.riverside.permits.domain.model.PermitStatus;
import uk.gov.riverside.permits.domain.repository.PermitRepository;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PermitControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PermitRepository permitRepository;

    // Requirement: FR-01, FR-03, FR-05, BR-6, BR-7
    @Test
    @DisplayName("GET /api/permits returns seeded permits sorted by start_date ASC with human-readable names")
    void shouldReturnPermitsWithHumanReadableNamesSortedByStartDate() throws Exception {
        mockMvc.perform(get("/api/permits")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", not(empty())))
                .andExpect(jsonPath("$.size", is(10)))
                // Verify BR-7: Hall and Purpose full names are present and not raw numeric IDs or codes
                .andExpect(jsonPath("$.content[0].hallName", not(emptyOrNullString())))
                .andExpect(jsonPath("$.content[0].purposeName", not(emptyOrNullString())));
    }

    // Requirement: FR-01, RC-1
    @Test
    @DisplayName("GET /api/permits filters by permitNumber case-insensitive prefix match")
    void shouldFilterByPermitNumberPrefix() throws Exception {
        mockMvc.perform(get("/api/permits")
                        .param("permitNumber", "p-2026")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", not(empty())))
                .andExpect(jsonPath("$.content[*].permitNumber", everyItem(startsWith("P-2026"))));
    }

    // Requirement: FR-07, BR-8
    @Test
    @DisplayName("GET /api/permits with no match returns 200 OK with empty content, never 404")
    void shouldReturnEmptyPageWhenNoMatchesFound() throws Exception {
        mockMvc.perform(get("/api/permits")
                        .param("holderName", "NonExistentHolderXYZ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)))
                .andExpect(jsonPath("$.totalPages", is(0)));
    }

    // Requirement: FR-08, RC-2
    @Test
    @DisplayName("GET /api/permits/{id} returns full permit detail")
    void shouldReturnPermitDetail() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0001").orElseThrow();

        mockMvc.perform(get("/api/permits/" + permit.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permitNumber", is("P-2026-0001")))
                .andExpect(jsonPath("$.holderName", is("Amelia Tan")))
                .andExpect(jsonPath("$.hallName", is("Riverside Community Hall")))
                .andExpect(jsonPath("$.purposeName", is("Community Event")))
                .andExpect(jsonPath("$.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("GET /api/permits/{id} returns 404 NOT_FOUND for non-existent permit")
    void shouldReturn404ForNonExistentPermit() throws Exception {
        mockMvc.perform(get("/api/permits/999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }

    // Requirement: FR-12, FR-14, FR-16, RC-3 Preview (Spec 1d: GET /api/permits/{id}/renewal-preview)
    @Test
    @DisplayName("GET /api/permits/{id}/renewal-preview returns calculated fee and 30-day cap breakdown per 1d spec")
    void shouldPreviewRenewalCalculationViaGetEndpoint() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0001").orElseThrow();
        LocalDate newEndDate = permit.getEndDate().plusDays(40); // 40 days -> capped at 30 days

        mockMvc.perform(get("/api/permits/" + permit.getId() + "/renewal-preview")
                        .param("newEndDate", newEndDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daysAdded", is(40)))
                .andExpect(jsonPath("$.cappedDays", is(30)))
                .andExpect(jsonPath("$.capped", is(true)))
                .andExpect(jsonPath("$.fee", is(3600.00)))
                .andExpect(jsonPath("$.calculatedFee", is(3600.00)))
                .andExpect(jsonPath("$.resultingStatus", is("AWAITING_PAYMENT")));
    }

    @Test
    @DisplayName("GET /api/permits/{id}/renewal-preview returns 400 for newEndDate not after current endDate")
    void shouldRejectInvalidEndDateOnGetPreview() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0001").orElseThrow();

        mockMvc.perform(get("/api/permits/" + permit.getId() + "/renewal-preview")
                        .param("newEndDate", permit.getEndDate().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_END_DATE")));
    }

    // Requirement: FR-12, FR-14, FR-16, RC-3 Preview
    @Test
    @DisplayName("POST /api/permits/{id}/renewals/preview returns calculated fee and 30-day cap breakdown")
    void shouldPreviewRenewalCalculation() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0001").orElseThrow();
        LocalDate newEndDate = permit.getEndDate().plusDays(40); // 40 days -> capped at 30 days

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + newEndDate + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daysAdded", is(40)))
                .andExpect(jsonPath("$.cappedDays", is(30)))
                .andExpect(jsonPath("$.isCapped", is(true)))
                // 30 days * 120 = 3600.00
                .andExpect(jsonPath("$.calculatedFee", is(3600.00)))
                .andExpect(jsonPath("$.resultingStatus", is("AWAITING_PAYMENT")));
    }

    // Requirement: BR-3
    @Test
    @DisplayName("POST /api/permits/{id}/renewals/preview returns 400 for newEndDate not after current endDate")
    void shouldRejectInvalidEndDateOnPreview() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0001").orElseThrow();

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + permit.getEndDate() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_END_DATE")));
    }

    // Requirement: FR-17, BR-5, BR-9
    @Test
    @DisplayName("POST /api/permits/{id}/renewals commits renewal and transitions non-Council permit to AWAITING_PAYMENT")
    void shouldCommitRenewalForStandardPermit() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0004").orElseThrow();
        LocalDate newEndDate = permit.getEndDate().plusDays(10);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + newEndDate + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endDate", is(newEndDate.toString())))
                .andExpect(jsonPath("$.status", is("AWAITING_PAYMENT")))
                .andExpect(jsonPath("$.renewalHistory", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.history[0].action", is("RENEWED")));
    }

    // Requirement: FR-15, BR-5
    @Test
    @DisplayName("POST /api/permits/{id}/renewals commits Council Use renewal with £0 fee and status ACTIVE")
    void shouldCommitCouncilUseRenewalWithZeroFeeAndActiveStatus() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0010").orElseThrow();
        LocalDate newEndDate = permit.getEndDate().plusDays(15);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + newEndDate + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endDate", is(newEndDate.toString())))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.renewalHistory[0].fee", is(0.00)));
    }

    // Requirement: BR-1, BR-2
    @Test
    @DisplayName("POST /api/permits/{id}/renewals rejects permits expired > 90 days with 409 EXPIRED_TOO_LONG")
    void shouldRejectPermitExpiredOver90Days() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0003").orElseThrow();
        LocalDate newEndDate = LocalDate.now().plusDays(7);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + newEndDate + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("EXPIRED_TOO_LONG")));
    }

    // Requirement: BR-1
    @Test
    @DisplayName("POST /api/permits/{id}/renewals rejects WITHDRAWN permits with 409 WRONG_STATUS")
    void shouldRejectWithdrawnPermitRenewal() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0008").orElseThrow();
        LocalDate newEndDate = LocalDate.now().plusDays(7);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + newEndDate + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("WRONG_STATUS")));
    }

    // Requirement: Validation Sequence (1d §4 RC-3)
    @Test
    @DisplayName("POST /api/permits/{id}/renewals rejects WITHDRAWN permit with 409 WRONG_STATUS even if newEndDate is invalid")
    void shouldRejectWithdrawnPermitEvenWithInvalidEndDate() throws Exception {
        PermitEntity permit = permitRepository.findByPermitNumber("P-2026-0008").orElseThrow();
        LocalDate invalidDate = permit.getEndDate().minusDays(1);

        mockMvc.perform(post("/api/permits/" + permit.getId() + "/renewals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEndDate\":\"" + invalidDate + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("WRONG_STATUS")));
    }
}
