package com.backend.project.controller;

import com.backend.project.dto.FacilityRequest;
import com.backend.project.model.Facility;
import com.backend.project.service.FacilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Facilities", description = "Manage campus facility records")
@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @Operation(summary = "Get all facilities",
               description = "Returns a list of all registered campus facilities.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of facilities returned")
    })
    @GetMapping
    public ResponseEntity<List<Facility>> getAllFacilities() {
        List<Facility> facilities = facilityService.getAllFacilities();
        return ResponseEntity.ok(facilities);
    }

    @Operation(summary = "Get a facility by ID",
               description = "Returns a single facility record by its numeric ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Facility found"),
        @ApiResponse(responseCode = "404", description = "Facility not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(
            @Parameter(description = "Facility ID", example = "1")
            @PathVariable Integer id) {
        Facility facility = facilityService.getFacilityById(id);
        return ResponseEntity.ok(facility);
    }

    @Operation(summary = "Create a facility",
               description = "Creates a new campus facility. Requires admin privileges.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Facility created"),
        @ApiResponse(responseCode = "400", description = "Validation error")
    })
    @SecurityRequirement(name = "bearerAuth")
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

    @Operation(summary = "Update a facility",
               description = "Updates an existing facility's details. Requires admin privileges.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Facility updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "404", description = "Facility not found")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}")
    public ResponseEntity<Facility> updateFacility(
            @Parameter(description = "Facility ID", example = "1")
            @PathVariable Integer id,
            @Valid @RequestBody FacilityRequest request) {
        Facility facilityDetails = new Facility();
        facilityDetails.setName(request.getName());
        facilityDetails.setLocation(request.getLocation());
        facilityDetails.setCapacity(request.getCapacity());
        facilityDetails.setType(request.getType());

        Facility updatedFacility = facilityService.updateFacility(id, facilityDetails);
        return ResponseEntity.ok(updatedFacility);
    }

    @Operation(summary = "Delete a facility",
               description = "Permanently deletes a facility. Requires admin privileges.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Facility deleted — no content returned"),
        @ApiResponse(responseCode = "404", description = "Facility not found")
    })
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFacility(
            @Parameter(description = "Facility ID", example = "1")
            @PathVariable Integer id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.noContent().build();
    }
}
