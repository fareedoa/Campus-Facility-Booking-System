package com.backend.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Request body for creating or updating a facility")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityRequest {

    @Schema(description = "Name of the facility", example = "Main Conference Hall")
    @NotBlank(message = "Name is required")
    private String name;

    @Schema(description = "Physical location of the facility", example = "Block A, Ground Floor")
    @NotBlank(message = "Location is required")
    private String location;

    @Schema(description = "Maximum number of occupants", example = "50")
    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be greater than 0")
    private Integer capacity;

    @Schema(description = "Type/category of the facility", example = "Auditorium")
    private String type;
}
