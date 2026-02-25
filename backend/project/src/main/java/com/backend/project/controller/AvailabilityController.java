package com.backend.project.controller;

import com.backend.project.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final BookingService bookingService;

    // Campus operating hours: 06:00 – 19:00
    private static final LocalTime OPEN_TIME  = LocalTime.of(6, 0);
    private static final LocalTime CLOSE_TIME = LocalTime.of(19, 0);

    /**
     * GET /api/availability
     * Check whether a specific time slot is available for a facility.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam Integer facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
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

    /**
     * GET /api/availability/slots?facilityId=X&date=YYYY-MM-DD
     *
     * Returns 30-minute time slots for the given facility and date.
     * Only slots within campus operating hours (06:00–19:00) are included.
     * Each slot is marked booked:true if there is a CONFIRMED booking
     * that overlaps the slot's time range.
     */
    @GetMapping("/slots")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @RequestParam Integer facilityId,
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
