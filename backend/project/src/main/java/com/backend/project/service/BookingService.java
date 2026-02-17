package com.backend.project.service;

import com.backend.project.dto.BookingRequest;
import com.backend.project.exception.BookingConflictException;
import com.backend.project.exception.ResourceNotFoundException;
import com.backend.project.model.Booking;
import com.backend.project.model.Facility;
import com.backend.project.model.User;
import com.backend.project.repository.BookingRepository;
import com.backend.project.repository.FacilityRepository;
import com.backend.project.repository.UserRepository;
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
    private final UserRepository userRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    @Transactional
    public Booking createBooking(BookingRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());

        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + request.getFacilityId()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

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
        booking.setUser(user);
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus("CONFIRMED");

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking updateBooking(Integer id, BookingRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        Facility facility = facilityRepository.findById(request.getFacilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + request.getFacilityId()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

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
        booking.setUser(user);
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());

        return bookingRepository.save(booking);
    }

    @Transactional
    public void cancelBooking(Integer id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
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
}
