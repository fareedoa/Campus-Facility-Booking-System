package com.backend.project.controller;

import com.backend.project.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {

        boolean available = bookingService.checkAvailability(facilityId, date, startTime, endTime);

        Map<String, Object> response = new HashMap<>();
        response.put("facilityId", facilityId);
        response.put("date", date.toString());
        response.put("startTime", startTime.toString());
        response.put("endTime", endTime.toString());
        response.put("available", available);

        return ResponseEntity.ok(response);
    }
}
