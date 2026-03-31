package com.university.eventmanagement.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Constructs the JDBC DataSource from individual DB_HOST, DB_PORT, DB_NAME
 * environment variables when running on Render (PostgreSQL).
 *
 * Falls back to the default DB_URL from application.properties (H2) for local dev.
 */
@Configuration
@Slf4j
public class DatabaseConfig {

    @Value("${DB_HOST:}")
    private String dbHost;

    @Value("${DB_PORT:}")
    private String dbPort;

    @Value("${DB_NAME:}")
    private String dbName;

    @Value("${DB_USERNAME:sa}")
    private String dbUsername;

    @Value("${DB_PASSWORD:}")
    private String dbPassword;

    @Value("${DB_DRIVER:org.h2.Driver}")
    private String dbDriver;

    @Value("${DB_URL:}")
    private String dbUrlFallback;

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        // If Render provides individual DB properties, construct JDBC URL
        if (dbHost != null && !dbHost.isEmpty()) {
            String port = (dbPort != null && !dbPort.isEmpty()) ? dbPort : "5432";
            String name = (dbName != null && !dbName.isEmpty()) ? dbName : "unievents";
            String jdbcUrl = "jdbc:postgresql://" + dbHost + ":" + port + "/" + name
                    + "?sslmode=require";

            log.info("🔗 Connecting to PostgreSQL at: jdbc:postgresql://{}:{}/{}", dbHost, port, name);

            properties.setUrl(jdbcUrl);
            properties.setUsername(dbUsername);
            properties.setPassword(dbPassword);
            properties.setDriverClassName(dbDriver);
        } else if (dbUrlFallback != null && !dbUrlFallback.isEmpty()) {
            log.info("🔗 Using DB_URL fallback: {}", dbUrlFallback.substring(0, Math.min(50, dbUrlFallback.length())) + "...");
            properties.setUrl(dbUrlFallback);
            properties.setUsername(dbUsername);
            properties.setPassword(dbPassword);
            properties.setDriverClassName(dbDriver);
        } else {
            log.info("🔗 Using default H2 database for local development");
        }

        return properties.initializeDataSourceBuilder().build();
    }
}
