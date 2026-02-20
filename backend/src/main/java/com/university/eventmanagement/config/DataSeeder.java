package com.university.eventmanagement.config;

import com.university.eventmanagement.model.Role;
import com.university.eventmanagement.model.User;
import com.university.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed Admin user
        if (!userRepository.existsByEmail("admin@university.edu")) {
            User admin = User.builder()
                    .fullName("System Administrator")
                    .email("admin@university.edu")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .department("Administration")
                    .build();
            userRepository.save(admin);
            log.info("✅ Default admin user created: admin@university.edu / Admin@123");
        }

        // Seed demo Organizer
        if (!userRepository.existsByEmail("organizer@university.edu")) {
            User organizer = User.builder()
                    .fullName("Demo Organizer")
                    .email("organizer@university.edu")
                    .password(passwordEncoder.encode("Organizer@123"))
                    .role(Role.ORGANIZER)
                    .department("Student Affairs")
                    .build();
            userRepository.save(organizer);
            log.info("✅ Default organizer user created: organizer@university.edu / Organizer@123");
        }

        // Seed demo Student
        if (!userRepository.existsByEmail("student@university.edu")) {
            User student = User.builder()
                    .fullName("Demo Student")
                    .email("student@university.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .studentId("STU001")
                    .role(Role.STUDENT)
                    .department("Computer Science")
                    .build();
            userRepository.save(student);
            log.info("✅ Default student user created: student@university.edu / Student@123");
        }
    }
}
