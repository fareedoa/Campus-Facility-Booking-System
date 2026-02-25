package com.backend.project.service;

import com.backend.project.dto.BookingRequest;
import com.backend.project.exception.BookingConflictException;
import com.backend.project.exception.ResourceNotFoundException;
import com.backend.project.model.Booking;
import com.backend.project.model.Facility;
import com.backend.project.repository.BookingRepository;
import com.backend.project.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;

    // Campus operating hours — no bookings allowed outside this window
    private static final LocalTime OPEN_TIME  = LocalTime.of(6, 0);   // 06:00
    private static final LocalTime CLOSE_TIME = LocalTime.of(19, 0);  // 19:00

    /**
     * Return ALL bookings (including cancelled) ordered most-recent first.
     * Used by both students (My Bookings) and admins (All Bookings).
     */
    public List<Booking> getAllBookings() {
        return bookingRepository.findAllBookings();
    }

    /**
     * Return bookings for a specific student.
     */
    public List<Booking> getBookingsByStudentId(String studentId) {
        return bookingRepository.findByStudentId(studentId);
    }

    public Booking getBookingById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    @Transactional
    public Booking createBooking(BookingRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateOperatingHours(request.getStartTime(), request.getEndTime());

        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + request.getFacilityId()));

        // Check for booking conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getFacilityId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "The requested time slot conflicts with an existing booking for this facility"
            );
        }

        Booking booking = new Booking();
        booking.setFacility(facility);
        booking.setStudentId(request.getStudentId());
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus("CONFIRMED");
        booking.setNotes(request.getNotes());

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateBooking(Integer id, BookingRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateOperatingHours(request.getStartTime(), request.getEndTime());

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + request.getFacilityId()));

        // Check for conflicts, excluding the current booking
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                request.getFacilityId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                id
        );

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "The requested time slot conflicts with an existing booking for this facility"
            );
        }

        booking.setFacility(facility);
        booking.setStudentId(request.getStudentId());
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setNotes(request.getNotes());

        // Allow admin to change status (e.g. CONFIRMED → COMPLETED)
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            booking.setStatus(request.getStatus().toUpperCase());
        }

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }

    @Transactional
    public void deleteBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        bookingRepository.delete(booking);
    }

    public boolean checkAvailability(Integer facilityId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        validateTimeRange(startTime, endTime);

        // Verify the facility exists
        facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facilityId, date, startTime, endTime
        );

        return conflicts.isEmpty();
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
    }

    /**
     * Enforce campus operating hours: bookings must be within 06:00 – 19:00.
     */
    private void validateOperatingHours(LocalTime startTime, LocalTime endTime) {
        if (startTime.isBefore(OPEN_TIME)) {
            throw new IllegalArgumentException(
                "Bookings cannot start before " + OPEN_TIME + " (campus opens at 6:00 AM)");
        }
        if (endTime.isAfter(CLOSE_TIME)) {
            throw new IllegalArgumentException(
                "Bookings cannot end after " + CLOSE_TIME + " (campus closes at 7:00 PM)");
        }
    }
}
