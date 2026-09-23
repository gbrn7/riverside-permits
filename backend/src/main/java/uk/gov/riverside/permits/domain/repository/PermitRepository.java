package uk.gov.riverside.permits.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uk.gov.riverside.permits.domain.model.PermitEntity;
import java.util.Optional;

@Repository
public interface PermitRepository extends JpaRepository<PermitEntity, Long>, JpaSpecificationExecutor<PermitEntity> {
    Optional<PermitEntity> findByPermitNumber(String permitNumber);

    @Query("SELECT p FROM PermitEntity p JOIN FETCH p.hall JOIN FETCH p.purpose WHERE p.id = :id")
    Optional<PermitEntity> findByIdWithHallAndPurpose(@Param("id") Long id);
}
