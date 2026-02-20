package com.university.eventmanagement.component;

import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final UserRepository userRepository;
        private final EventRepository eventRepository;
        private final RegistrationRepository registrationRepository;
        private final AttendanceLogRepository attendanceLogRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) throws Exception {
                if (!userRepository.existsByEmail("admin@university.com")) {
                        User admin = User.builder()
                                        .fullName("System Admin")
                                        .email("admin@university.com")
                                        .password(passwordEncoder.encode("admin123"))
                                        .role(Role.ADMIN)
                                        .department("Administration")
                                        .phone("0000000000")
                                        .build();
                        userRepository.save(admin);
                        System.out.println("Default admin user created: admin@university.com / admin123");
                }

                if (!userRepository.existsByEmail("student@university.com")) {
                        User student = User.builder()
                                        .fullName("John Doe")
                                        .email("student@university.com")
                                        .password(passwordEncoder.encode("student123"))
                                        .role(Role.STUDENT)
                                        .studentId("S12345")
                                        .department("Computer Science")
                                        .phone("1234567890")
                                        .build();
                        userRepository.save(student);

                        User organizer = User.builder()
                                        .fullName("Prof. Smith")
                                        .email("organizer@university.com")
                                        .password(passwordEncoder.encode("organizer123"))
                                        .role(Role.ORGANIZER)
                                        .department("Information Technology")
                                        .build();
                        userRepository.save(organizer);

                        // Create Events
                        Event e1 = Event.builder()
                                        .title("Web Tech Workshop")
                                        .description("Learn React and Spring Boot")
                                        .eventDate(LocalDate.now().plusDays(5))
                                        .startTime(LocalTime.of(10, 0))
                                        .venue("Lab 101")
                                        .capacity(50)
                                        .status(EventStatus.UPCOMING)
                                        .createdBy(organizer)
                                        .build();

                        Event e2 = Event.builder()
                                        .title("Annual Sports Meet")
                                        .description("University level sports event")
                                        .eventDate(LocalDate.now().minusDays(2))
                                        .startTime(LocalTime.of(9, 0))
                                        .status(EventStatus.COMPLETED)
                                        .venue("University Ground")
                                        .capacity(200)
                                        .createdBy(organizer)
                                        .build();

                        Event e3 = Event.builder()
                                        .title("AI & Ethics Seminar")
                                        .description("Discussion on future of AI")
                                        .eventDate(LocalDate.now().plusDays(10))
                                        .startTime(LocalTime.of(14, 0))
                                        .status(EventStatus.UPCOMING)
                                        .venue("Main Hall")
                                        .capacity(100)
                                        .createdBy(organizer)
                                        .build();

                        Event e4 = Event.builder()
                                        .title("Coding Marathon")
                                        .description("24 hour hackathon")
                                        .eventDate(LocalDate.now().minusDays(10))
                                        .startTime(LocalTime.of(10, 0))
                                        .status(EventStatus.COMPLETED)
                                        .venue("Innovation Center")
                                        .capacity(50)
                                        .createdBy(organizer)
                                        .build();

                        List<Event> eventsToSave = List.of(e1, e2, e3, e4);
                        eventRepository.saveAll(eventsToSave);

                        // Registrations for student
                        Registration r1 = Registration.builder().user(student).event(e1).qrCodeData("REF-E1-S12345")
                                        .build();
                        Registration r2 = Registration.builder().user(student).event(e2).qrCodeData("REF-E2-S12345")
                                        .build();
                        Registration r3 = Registration.builder().user(student).event(e4).qrCodeData("REF-E4-S12345")
                                        .build();
                        List<Registration> registrationsToSave = List.of(r1, r2, r3);
                        registrationRepository.saveAll(registrationsToSave);

                        // Attendance (Present for Sports, Absent for Hackathon e4)
                        AttendanceLog al1 = new AttendanceLog();
                        al1.setUser(student);
                        al1.setEvent(e2);
                        attendanceLogRepository.save(al1);
                }
        }
}
