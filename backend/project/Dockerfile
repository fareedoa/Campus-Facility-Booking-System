# Use Java 21 (or 17 depending on your project)
FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy everything
COPY . .

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose port
EXPOSE 8080

# Run the jar
CMD ["java", "-jar", "target/*.jar"]