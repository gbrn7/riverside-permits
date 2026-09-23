package uk.gov.riverside.permits.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "purposes")
public class PurposeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_council_use", nullable = false)
    private Boolean isCouncilUse = false;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PurposeEntity() {}

    public PurposeEntity(String code, String name, Boolean isCouncilUse, Boolean active) {
        this.code = code;
        this.name = name;
        this.isCouncilUse = isCouncilUse != null ? isCouncilUse : false;
        this.active = active != null ? active : true;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Boolean getIsCouncilUse() { return isCouncilUse; }
    public void setIsCouncilUse(Boolean isCouncilUse) { this.isCouncilUse = isCouncilUse; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
