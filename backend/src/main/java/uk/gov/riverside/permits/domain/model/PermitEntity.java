package uk.gov.riverside.permits.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "permits")
public class PermitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "permit_number", nullable = false, unique = true, length = 20)
    private String permitNumber;

    @Column(name = "holder_name", nullable = false, length = 200)
    private String holderName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hall_id", nullable = false)
    private HallEntity hall;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purpose_id", nullable = false)
    private PurposeEntity purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PermitStatus status;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fee;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public PermitEntity() {}

    public PermitEntity(String permitNumber, String holderName, HallEntity hall, PurposeEntity purpose,
                        PermitStatus status, LocalDate startDate, LocalDate endDate, BigDecimal fee) {
        this.permitNumber = permitNumber;
        this.holderName = holderName;
        this.hall = hall;
        this.purpose = purpose;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.fee = fee;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPermitNumber() { return permitNumber; }
    public void setPermitNumber(String permitNumber) { this.permitNumber = permitNumber; }

    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public HallEntity getHall() { return hall; }
    public void setHall(HallEntity hall) { this.hall = hall; }

    public PurposeEntity getPurpose() { return purpose; }
    public void setPurpose(PurposeEntity purpose) { this.purpose = purpose; }

    public PermitStatus getStatus() { return status; }
    public void setStatus(PermitStatus status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
