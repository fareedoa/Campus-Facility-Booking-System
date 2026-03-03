package com.backend.project.controller;

import com.backend.project.dto.BookingRequest;
import com.backend.project.model.Booking;
import com.backend.project.service.BookingService;
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
import java.util.Map;

@Tag(name = "Bookings", description = "Create, read, update, cancel, and delete facility bookings")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @Operation(summary = "Get all bookings",
               description = "Returns ALL bookings (including cancelled) for history. "
                           + "Pass `studentId` to filter by student.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of bookings returned")
    })
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(
            @Parameter(description = "Optional student ID to filter bookings")
            @RequestParam(required = false) String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return ResponseEntity.ok(bookingService.getBookingsByStudentId(studentId));
        }
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @Operation(summary = "Get a booking by ID",
               description = "Returns a single booking record by its numeric ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Booking found"),
        @ApiResponse(responseCode = "404", description = "Booking not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(
            @Parameter(description = "Booking ID", example = "1")
            @PathVariable Integer id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @Operation(summary = "Create a booking",
               description = "Creates a new facility booking. Returns 201 Created with the saved booking.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Booking created successfully"),
        @ApiResponse(responseCode = "400", description = "Validation error or time conflict")
    })
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

    @Operation(summary = "Update a booking",
               description = "Admin endpoint — updates date, time, status, or notes for an existing booking.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Booking updated successfully"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "404", description = "Booking not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(
            @Parameter(description = "Booking ID", example = "1")
            @PathVariable Integer id,
            @Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.updateBooking(id, request);
        return ResponseEntity.ok(booking);
    }

    @Operation(summary = "Cancel a booking",
               description = "Soft-cancels a booking by setting its status to CANCELLED. The record is preserved.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Booking cancelled"),
        @ApiResponse(responseCode = "404", description = "Booking not found")
    })
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @Parameter(description = "Booking ID", example = "1")
            @PathVariable Integer id) {
        Booking cancelled = bookingService.cancelBooking(id);
        return ResponseEntity.ok(cancelled);
    }

    @Operation(summary = "Delete a booking",
               description = "Hard-deletes a booking record permanently (admin only).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Booking deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Booking not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBooking(
            @Parameter(description = "Booking ID", example = "1")
            @PathVariable Integer id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
    }
}
