package uk.gov.riverside.permits.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uk.gov.riverside.permits.domain.model.HallEntity;
import java.util.Optional;

@Repository
public interface HallRepository extends JpaRepository<HallEntity, Long> {
    Optional<HallEntity> findByName(String name);
}
