package com.backend.project;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.backend.project.model.Facility;
import com.backend.project.repository.FacilityRepository;

@SpringBootApplication
public class ProjectApplication {

	public static void main(String[] args) {
        SpringApplication.run(ProjectApplication.class, args
        );
	}

	@Bean
	CommandLineRunner initFacilities(FacilityRepository facilityRepository) {
		return args -> {
			// Only seed if no facilities exist
			if (facilityRepository.findAll().isEmpty()) {
				facilityRepository.save(new Facility(null, "Engineering Lecture Hall A", "Building A, Floor 1", 150, "Lecture Hall"));
				facilityRepository.save(new Facility(null, "Biology Lab 1", "Science Complex, Room 201", 30, "Lab"));
				facilityRepository.save(new Facility(null, "Study Room B2", "Library, 2nd Floor", 15, "Study Room"));
				facilityRepository.save(new Facility(null, "Conference Room West", "Administration Building", 20, "Conference"));
				facilityRepository.save(new Facility(null, "Sports Gymnasium", "Athletic Center", 500, "Sports"));
				facilityRepository.save(new Facility(null, "Chemistry Lab", "Science Complex, Room 305", 25, "Lab"));
				facilityRepository.save(new Facility(null, "Lecture Hall B", "Building B, Floor 3", 200, "Lecture Hall"));
				facilityRepository.save(new Facility(null, "Study Room A1", "Library, 1st Floor", 12, "Study Room"));
				System.out.println("[INIT] Sample facilities created successfully");
			}
		};
	}

}
