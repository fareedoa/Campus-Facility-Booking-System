package com.backend.project.repository;

import com.backend.project.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    /**
     * Find bookings that conflict with a requested time slot for a given facility.
     * A conflict occurs when an existing CONFIRMED booking overlaps the requested time range.
     */
    @Query("SELECT b FROM Booking b WHERE b.facility.id = :facilityId " +
           "AND b.date = :date " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("facilityId") Integer facilityId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    /**
     * Find conflicting bookings excluding a specific booking (used for updates).
     */
    @Query("SELECT b FROM Booking b WHERE b.facility.id = :facilityId " +
           "AND b.date = :date " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.id <> :excludeId " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookingsExcluding(
            @Param("facilityId") Integer facilityId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Integer excludeId
    );

    /**
     * Find all bookings that are not cancelled.
     */
    @Query("SELECT b FROM Booking b WHERE b.status <> 'CANCELLED'")
    List<Booking> findAllActive();
}
