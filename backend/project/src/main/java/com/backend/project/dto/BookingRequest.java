package com.backend.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Schema(description = "Request body for creating or updating a booking")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {

    @Schema(description = "ID of the facility to book", example = "1")
    @NotNull(message = "Facility ID is required")
    private Integer facilityId;

    @Schema(description = "Student ID of the person making the booking", example = "S12345")
    @NotNull(message = "Student ID is required")
    private String studentId;

    @Schema(description = "Date of the booking (ISO format)", example = "2025-06-15")
    @NotNull(message = "Date is required")
    private LocalDate date;

    @Schema(description = "Booking start time (ISO format)", example = "09:00:00")
    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @Schema(description = "Booking end time (ISO format)", example = "10:30:00")
    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @Schema(description = "Optional notes or purpose for the booking", example = "Project team meeting")
    private String notes;

    @Schema(description = "Booking status — used by admin to override status",
            example = "CONFIRMED",
            allowableValues = {"CONFIRMED", "CANCELLED", "PENDING"})
    private String status;
}
