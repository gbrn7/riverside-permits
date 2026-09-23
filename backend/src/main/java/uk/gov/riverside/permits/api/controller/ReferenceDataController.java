package uk.gov.riverside.permits.api.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uk.gov.riverside.permits.api.dto.HallDto;
import uk.gov.riverside.permits.api.dto.PurposeDto;
import uk.gov.riverside.permits.domain.repository.HallRepository;
import uk.gov.riverside.permits.domain.repository.PurposeRepository;

import java.util.List;

@RestController
@RequestMapping("/api/reference")
@CrossOrigin(origins = "*")
public class ReferenceDataController {

    private final HallRepository hallRepository;
    private final PurposeRepository purposeRepository;

    public ReferenceDataController(HallRepository hallRepository, PurposeRepository purposeRepository) {
        this.hallRepository = hallRepository;
        this.purposeRepository = purposeRepository;
    }

    @GetMapping("/halls")
    public List<HallDto> getHalls() {
        return hallRepository.findAll().stream()
                .filter(h -> Boolean.TRUE.equals(h.getActive()))
                .map(h -> new HallDto(h.getId(), h.getName(), h.getDistrict(), h.getDailyRate()))
                .toList();
    }

    @GetMapping("/purposes")
    public List<PurposeDto> getPurposes() {
        return purposeRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .map(p -> new PurposeDto(p.getId(), p.getCode(), p.getName(), p.getIsCouncilUse()))
                .toList();
    }
}
