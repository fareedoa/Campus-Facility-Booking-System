package com.backend.project.controller;

import com.backend.project.dto.FacilityRequest;
import com.backend.project.model.Facility;
import com.backend.project.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @GetMapping
    public ResponseEntity<List<Facility>> getAllFacilities() {
        List<Facility> facilities = facilityService.getAllFacilities();
        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable Integer id) {
        Facility facility = facilityService.getFacilityById(id);
        return ResponseEntity.ok(facility);
    }

    @PostMapping
    public ResponseEntity<Facility> createFacility(@Valid @RequestBody FacilityRequest request) {
        Facility facility = new Facility();
        facility.setName(request.getName());
        facility.setLocation(request.getLocation());
        facility.setCapacity(request.getCapacity());
        facility.setType(request.getType());

        Facility createdFacility = facilityService.createFacility(facility);
        return new ResponseEntity<>(createdFacility, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Facility> updateFacility(@PathVariable Integer id, @Valid @RequestBody FacilityRequest request) {
        Facility facilityDetails = new Facility();
        facilityDetails.setName(request.getName());
        facilityDetails.setLocation(request.getLocation());
        facilityDetails.setCapacity(request.getCapacity());
        facilityDetails.setType(request.getType());

        Facility updatedFacility = facilityService.updateFacility(id, facilityDetails);
        return ResponseEntity.ok(updatedFacility);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Integer id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
