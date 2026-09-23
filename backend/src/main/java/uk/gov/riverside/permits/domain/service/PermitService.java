package uk.gov.riverside.permits.domain.service;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.gov.riverside.permits.api.dto.*;
import uk.gov.riverside.permits.domain.exception.IneligibleStatusException;
import uk.gov.riverside.permits.domain.exception.PermitAlreadyStartedException;
import uk.gov.riverside.permits.domain.exception.ResourceNotFoundException;
import uk.gov.riverside.permits.domain.model.PermitEntity;
import uk.gov.riverside.permits.domain.model.PermitHistoryEntity;
import uk.gov.riverside.permits.domain.model.PermitStatus;
import uk.gov.riverside.permits.domain.model.RenewalRecordEntity;
import uk.gov.riverside.permits.domain.repository.PermitHistoryRepository;
import uk.gov.riverside.permits.domain.repository.PermitRepository;
import uk.gov.riverside.permits.domain.repository.RenewalRecordRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Requirement: FR-01 through FR-18, BR-1 through BR-10
 */
@Service
public class PermitService {

    private final PermitRepository permitRepository;
    private final RenewalRecordRepository renewalRecordRepository;
    private final PermitHistoryRepository permitHistoryRepository;
    private final FeeCalculator feeCalculator;
    private final PermitEligibilityValidator eligibilityValidator;

    public PermitService(PermitRepository permitRepository,
                         RenewalRecordRepository renewalRecordRepository,
                         PermitHistoryRepository permitHistoryRepository,
                         FeeCalculator feeCalculator,
                         PermitEligibilityValidator eligibilityValidator) {
        this.permitRepository = permitRepository;
        this.renewalRecordRepository = renewalRecordRepository;
        this.permitHistoryRepository = permitHistoryRepository;
        this.feeCalculator = feeCalculator;
        this.eligibilityValidator = eligibilityValidator;
    }

    /**
     * Requirement: FR-01, FR-02, FR-03, FR-04, FR-05, BR-6, BR-7, BR-8
     */
    @Transactional(readOnly = true)
    public PageResponse<PermitSummaryDto> searchPermits(
            String permitNumber,
            String holderName,
            Long hallId,
            Long purposeId,
            PermitStatus status,
            LocalDate startDateFrom,
            LocalDate startDateTo,
            int page,
            int size) {

        // BR-6: Sort order default start_date ASC, tie-breaker created_at DESC
        Sort sort = Sort.by(Sort.Order.asc("startDate"), Sort.Order.desc("createdAt"));
        Pageable pageable = PageRequest.of(Math.max(page, 0), size > 0 ? size : 10, sort);

        Specification<PermitEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (permitNumber != null && !permitNumber.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("permitNumber")), permitNumber.trim().toLowerCase() + "%"));
            }

            if (holderName != null && !holderName.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("holderName")), "%" + holderName.trim().toLowerCase() + "%"));
            }

            if (hallId != null) {
                predicates.add(cb.equal(root.get("hall").get("id"), hallId));
            }

            if (purposeId != null) {
                predicates.add(cb.equal(root.get("purpose").get("id"), purposeId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (startDateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startDate"), startDateFrom));
            }

            if (startDateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), startDateTo));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PermitEntity> permitPage = permitRepository.findAll(spec, pageable);

        // BR-8: Empty state returns 200 OK with content: [], totalElements: 0
        List<PermitSummaryDto> content = permitPage.getContent().stream()
                .map(this::toSummaryDto)
                .toList();

        return new PageResponse<>(
                content,
                permitPage.getNumber(),
                permitPage.getSize(),
                permitPage.getTotalElements(),
                permitPage.getTotalPages()
        );
    }

    /**
     * Requirement: FR-08, FR-09, BR-7
     */
    @Transactional(readOnly = true)
    public PermitDetailDto getPermitDetail(Long id) {
        PermitEntity permit = permitRepository.findByIdWithHallAndPurpose(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit with id " + id + " not found"));

        return toDetailDto(permit);
    }

    /**
     * Requirement: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, BR-1, BR-2, BR-3, BR-4, BR-5
     */
    @Transactional(readOnly = true)
    public RenewalPreviewDto previewRenewal(Long id, RenewalRequest request) {
        PermitEntity permit = permitRepository.findByIdWithHallAndPurpose(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit with id " + id + " not found"));

        eligibilityValidator.validateRenewalEligibility(permit, request.newEndDate());

        FeeCalculator.CalculationResult calc = feeCalculator.calculateRenewalFee(
                permit.getEndDate(),
                request.newEndDate(),
                permit.getHall(),
                permit.getPurpose()
        );

        PermitStatus resultingStatus = calc.isCouncilUse() ? PermitStatus.ACTIVE : PermitStatus.AWAITING_PAYMENT;

        return new RenewalPreviewDto(
                permit.getId(),
                permit.getPermitNumber(),
                permit.getHall().getName(),
                permit.getPurpose().getName(),
                calc.isCouncilUse(),
                permit.getEndDate(),
                request.newEndDate(),
                calc.daysAdded(),
                calc.cappedDays(),
                calc.dailyRate(),
                calc.fee(),
                calc.isCapped(),
                resultingStatus
        );
    }

    /**
     * Requirement: FR-17, BR-5, BR-9, BR-10 (Atomic transactional execution)
     */
    @Transactional
    public PermitDetailDto commitRenewal(Long id, RenewalRequest request) {
        PermitEntity permit = permitRepository.findByIdWithHallAndPurpose(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit with id " + id + " not found"));

        // 1. Validate eligibility
        eligibilityValidator.validateRenewalEligibility(permit, request.newEndDate());

        // 2. Calculate fee
        LocalDate previousEndDate = permit.getEndDate();
        LocalDate newEndDate = request.newEndDate();

        FeeCalculator.CalculationResult calc = feeCalculator.calculateRenewalFee(
                previousEndDate,
                newEndDate,
                permit.getHall(),
                permit.getPurpose()
        );

        PermitStatus nextStatus = calc.isCouncilUse() ? PermitStatus.ACTIVE : PermitStatus.AWAITING_PAYMENT;
        String performedBy = "system"; // BR-10

        // 3. Insert into renewal_records
        RenewalRecordEntity renewalRecord = new RenewalRecordEntity(
                permit.getId(),
                previousEndDate,
                newEndDate,
                calc.fee(),
                performedBy
        );
        renewalRecordRepository.save(renewalRecord);

        // 4. Update permits table
        permit.setEndDate(newEndDate);
        permit.setStatus(nextStatus);
        permit.setUpdatedAt(LocalDateTime.now());
        permitRepository.save(permit);

        // 5. Insert into permit_history table
        String detailJson = String.format(
                "{\"previousEndDate\":\"%s\",\"newEndDate\":\"%s\",\"fee\":\"%s\"}",
                previousEndDate, newEndDate, calc.fee()
        );
        PermitHistoryEntity history = new PermitHistoryEntity(
                permit.getId(),
                "RENEWED",
                detailJson,
                performedBy
        );
        permitHistoryRepository.save(history);

        return toDetailDto(permit);
    }

    private PermitSummaryDto toSummaryDto(PermitEntity p) {
        return new PermitSummaryDto(
                p.getId(),
                p.getPermitNumber(),
                p.getHolderName(),
                p.getHall().getName(),
                p.getPurpose().getName(),
                p.getStatus(),
                p.getStartDate(),
                p.getEndDate(),
                p.getFee()
        );
    }

    private PermitDetailDto toDetailDto(PermitEntity p) {
        List<RenewalRecordDto> renewalDtos = renewalRecordRepository.findByPermitIdOrderByPerformedAtDesc(p.getId())
                .stream()
                .map(r -> new RenewalRecordDto(r.getId(), r.getPreviousEndDate(), r.getNewEndDate(), r.getFee(), r.getPerformedAt()))
                .toList();

        List<PermitHistoryDto> historyDtos = permitHistoryRepository.findByPermitIdOrderByPerformedAtDesc(p.getId())
                .stream()
                .map(h -> new PermitHistoryDto(h.getAction(), h.getDetail(), h.getPerformedAt()))
                .toList();

        return new PermitDetailDto(
                p.getId(),
                p.getPermitNumber(),
                p.getHolderName(),
                p.getHall().getId(),
                p.getHall().getName(),
                p.getPurpose().getId(),
                p.getPurpose().getName(),
                p.getPurpose().getIsCouncilUse(),
                p.getStatus(),
                p.getStartDate(),
                p.getEndDate(),
                p.getFee(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                renewalDtos,
                historyDtos
        );
    }

    /**
     * Requirement: FR-19, FR-20, FR-21, FR-22, FR-23, FR-24
     * Business Rules: BR-11, BR-12, BR-13, BR-14, BR-15
     */
    @Transactional
    public PermitDetailDto withdrawPermit(Long id, WithdrawPermitRequest request) {
        PermitEntity permit = permitRepository.findByIdWithHallAndPurpose(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permit with id " + id + " not found"));

        if (permit.getStatus() == PermitStatus.WITHDRAWN) {
            throw new IneligibleStatusException("Permit is already in terminal status WITHDRAWN and cannot be withdrawn again.");
        }

        LocalDate today = LocalDate.now();
        if (!permit.getStartDate().isAfter(today)) {
            throw new PermitAlreadyStartedException("Permit cannot be withdrawn because the event has already started (start date: " 
                    + permit.getStartDate() + "). In-progress or past events must be processed via cancellation.");
        }

        permit.setStatus(PermitStatus.WITHDRAWN);
        permit.setUpdatedAt(LocalDateTime.now());
        permitRepository.save(permit);

        PermitHistoryEntity history = new PermitHistoryEntity(
                permit.getId(),
                "WITHDRAWN",
                request.reason().trim(),
                "system"
        );
        permitHistoryRepository.save(history);

        return toDetailDto(permit);
    }
}
