# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create directories for uploads and data with correct ownership
RUN mkdir -p /app/uploads /app/data && chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

# Render sets PORT env var automatically
EXPOSE 8080

# Production-optimized JVM flags
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
