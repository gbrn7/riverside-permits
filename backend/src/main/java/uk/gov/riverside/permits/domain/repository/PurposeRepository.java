package uk.gov.riverside.permits.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uk.gov.riverside.permits.domain.model.PurposeEntity;
import java.util.Optional;

@Repository
public interface PurposeRepository extends JpaRepository<PurposeEntity, Long> {
    Optional<PurposeEntity> findByCode(String code);
    Optional<PurposeEntity> findByName(String name);
}
