package com.backend.project;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProjectApplication {

	public static void main(String[] args) {
        Dotenv.load();
        SpringApplication.run(ProjectApplication.class, args
        );
	}

}
