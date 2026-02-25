package com.backend.project.controller;

import com.backend.project.dto.BookingRequest;
import com.backend.project.model.Booking;
import com.backend.project.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * GET /api/bookings
     * Returns ALL bookings (including cancelled) for history.
     * Optional ?studentId=X filter for student-specific view.
     */
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(
            @RequestParam(required = false) String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return ResponseEntity.ok(bookingService.getBookingsByStudentId(studentId));
        }
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    /**
     * GET /api/bookings/{id}
     * Returns a single booking by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Integer id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    /**
     * POST /api/bookings
     * Create a new booking. Returns 201 Created.
     */
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    /**
     * PUT /api/bookings/{id}
     * Update a booking (admin — can change date, time, status, notes).
     */
    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable Integer id,
            @Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.updateBooking(id, request);
        return ResponseEntity.ok(booking);
    }

    /**
     * PATCH /api/bookings/{id}/cancel
     * Soft-cancel: sets status = CANCELLED without deleting the record.
     * This is the action students use from the My Bookings page.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Integer id) {
        Booking cancelled = bookingService.cancelBooking(id);
        return ResponseEntity.ok(cancelled);
    }

    /**
     * DELETE /api/bookings/{id}
     * Hard-delete: permanently removes the record (admin only).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBooking(@PathVariable Integer id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
    }
}
