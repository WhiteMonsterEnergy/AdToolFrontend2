FROM ubuntu:latest
LABEL authors="Sebastian"

ENTRYPOINT ["top", "-b"]
#Build stage
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Copy Maven wrapper and pom first for dependency caching
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src src

# Build JAR without tests
RUN ./mvnw clean package -DskipTests

#Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy built JAR
COPY --from=build /app/target/AdToolFrontend2-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
