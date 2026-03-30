package com.university.eventmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // Basic async configuration, mostly to enable @Async processing across the
    // application.
}
