# Use Java 21
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Build the project using Maven wrapper
RUN ./mvnw clean package -DskipTests

# Expose port 8080
EXPOSE 8080

# Copy the built jar to a known name
RUN cp target/project-0.0.1-SNAPSHOT.jar app.jar

# Run the application
CMD ["java", "-jar", "app.jar"]