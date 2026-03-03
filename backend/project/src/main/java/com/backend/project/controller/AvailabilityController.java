package com.backend.project.controller;

import com.backend.project.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Tag(name = "Availability", description = "Check facility availability and browse 30-minute time slots")
@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final BookingService bookingService;

    // Campus operating hours: 06:00 – 19:00
    private static final LocalTime OPEN_TIME  = LocalTime.of(6, 0);
    private static final LocalTime CLOSE_TIME = LocalTime.of(19, 0);

    @Operation(summary = "Check a specific time slot",
               description = "Returns whether the given facility is available for the requested date and time range.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Availability status returned")
    })
    @GetMapping
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @Parameter(description = "Facility ID", example = "1")
            @RequestParam Integer facilityId,
            @Parameter(description = "Date in ISO format (YYYY-MM-DD)", example = "2025-06-15")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "Start time in ISO format (HH:MM:SS)", example = "09:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @Parameter(description = "End time in ISO format (HH:MM:SS)", example = "10:30:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {

        boolean available = bookingService.checkAvailability(facilityId, date, startTime, endTime);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("facilityId", facilityId);
        response.put("date", date.toString());
        response.put("startTime", startTime.toString());
        response.put("endTime", endTime.toString());
        response.put("available", available);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get available 30-minute slots",
               description = "Returns all 30-minute slots within campus operating hours (06:00–19:00) "
                           + "for the given facility and date. Each slot has a `booked` flag.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Slot list returned")
    })
    @GetMapping("/slots")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @Parameter(description = "Facility ID", example = "1")
            @RequestParam Integer facilityId,
            @Parameter(description = "Date in ISO format (YYYY-MM-DD)", example = "2025-06-15")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<Map<String, Object>> slots = new ArrayList<>();

        LocalTime cursor = OPEN_TIME;
        while (cursor.isBefore(CLOSE_TIME)) {
            LocalTime slotStart = cursor;
            LocalTime slotEnd   = cursor.plusMinutes(30);

            // Only include the slot if its end does not exceed closing time
            if (!slotEnd.isAfter(CLOSE_TIME)) {
                boolean available = bookingService.checkAvailability(facilityId, date, slotStart, slotEnd);

                Map<String, Object> slot = new LinkedHashMap<>();
                slot.put("start",  String.format("%02d:%02d", slotStart.getHour(), slotStart.getMinute()));
                slot.put("end",    String.format("%02d:%02d", slotEnd.getHour(),   slotEnd.getMinute()));
                slot.put("booked", !available);
                slots.add(slot);
            }

            cursor = cursor.plusMinutes(30);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("facilityId", facilityId);
        response.put("date", date.toString());
        response.put("slots", slots);

        return ResponseEntity.ok(response);
    }
}
