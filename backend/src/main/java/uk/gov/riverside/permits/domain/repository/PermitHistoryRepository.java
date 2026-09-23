package uk.gov.riverside.permits.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uk.gov.riverside.permits.domain.model.PermitHistoryEntity;
import java.util.List;

@Repository
public interface PermitHistoryRepository extends JpaRepository<PermitHistoryEntity, Long> {
    List<PermitHistoryEntity> findByPermitIdOrderByPerformedAtDesc(Long permitId);
}
