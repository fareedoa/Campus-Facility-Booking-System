package com.backend.project.service;

import com.backend.project.exception.ResourceNotFoundException;
import com.backend.project.model.Facility;
import com.backend.project.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public Facility getFacilityById(Integer id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + id));
    }

    public Facility createFacility(Facility facility) {
        return facilityRepository.save(facility);
    }

    public Facility updateFacility(Integer id, Facility facilityDetails) {
        Facility facility = getFacilityById(id);
        facility.setName(facilityDetails.getName());
        facility.setLocation(facilityDetails.getLocation());
        facility.setCapacity(facilityDetails.getCapacity());
        // Bug fix: type was never updated on edit
        if (facilityDetails.getType() != null) {
            facility.setType(facilityDetails.getType());
        }
        return facilityRepository.save(facility);
    }

    public void deleteFacility(Integer id) {
        Facility facility = getFacilityById(id);
        facilityRepository.delete(facility);
    }
}
