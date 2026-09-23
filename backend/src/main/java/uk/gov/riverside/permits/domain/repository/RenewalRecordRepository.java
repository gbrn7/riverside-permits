package uk.gov.riverside.permits.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uk.gov.riverside.permits.domain.model.RenewalRecordEntity;
import java.util.List;

@Repository
public interface RenewalRecordRepository extends JpaRepository<RenewalRecordEntity, Long> {
    List<RenewalRecordEntity> findByPermitIdOrderByPerformedAtDesc(Long permitId);
}
