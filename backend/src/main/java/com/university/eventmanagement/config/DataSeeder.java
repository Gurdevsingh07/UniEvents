package com.university.eventmanagement.config;

import com.university.eventmanagement.model.AppRole;
import com.university.eventmanagement.model.RoleScope;
import com.university.eventmanagement.model.UserRole;
import com.university.eventmanagement.model.User;
import com.university.eventmanagement.repository.AppRoleRepository;
import com.university.eventmanagement.repository.UserRepository;
import com.university.eventmanagement.repository.DepartmentRepository;
import com.university.eventmanagement.model.Department;
import com.university.eventmanagement.model.Permission;
import com.university.eventmanagement.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final DepartmentRepository departmentRepository;
        private final AppRoleRepository appRoleRepository;
        private final PermissionRepository permissionRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) {
                Department adminDept = departmentRepository.findByName("Administration")
                                .orElseGet(() -> departmentRepository
                                                .save(Department.builder().name("Administration").code("ADMIN")
                                                                .build()));
                Department affairsDept = departmentRepository.findByName("Student Affairs")
                                .orElseGet(() -> departmentRepository
                                                .save(Department.builder().name("Student Affairs").code("SA").build()));
                Department csDept = departmentRepository.findByName("Computer Science")
                                .orElseGet(() -> departmentRepository
                                                .save(Department.builder().name("Computer Science").code("CS")
                                                                .build()));

                List<String> adminPerms = Arrays.asList("MANAGE_USERS", "MANAGE_EVENTS", "MANAGE_DEPARTMENTS",
                                "VIEW_REPORTS", "MANAGE_ATTENDANCE", "VIEW_REGISTRATIONS", "ASSIGN_TASKS",
                                "ACCESS_VOLUNTEER_PANEL");
                List<String> orgPerms = Arrays.asList("MANAGE_EVENTS", "MANAGE_ATTENDANCE", "VIEW_REPORTS",
                                "VIEW_REGISTRATIONS", "ASSIGN_TASKS", "ACCESS_VOLUNTEER_PANEL", "MANAGE_MEMBERS");
                List<String> stuPerms = Arrays.asList("ENROLL_EVENT");
                List<String> volPerms = Arrays.asList("ACCESS_VOLUNTEER_PANEL");

                // Seed all permissions
                for (String permName : adminPerms) {
                        permissionRepository.findByName(permName)
                                        .orElseGet(() -> permissionRepository.save(Permission.builder().name(permName)
                                                        .description(permName).build()));
                }
                for (String permName : orgPerms) {
                        permissionRepository.findByName(permName)
                                        .orElseGet(() -> permissionRepository.save(Permission.builder().name(permName)
                                                        .description(permName).build()));
                }
                for (String permName : stuPerms) {
                        permissionRepository.findByName(permName)
                                        .orElseGet(() -> permissionRepository.save(Permission.builder().name(permName)
                                                        .description(permName).build()));
                }
                for (String permName : volPerms) {
                        permissionRepository.findByName(permName)
                                        .orElseGet(() -> permissionRepository.save(Permission.builder().name(permName)
                                                        .description(permName).build()));
                }

                AppRole adminRole = appRoleRepository.findByName("ADMIN")
                                .orElseGet(() -> appRoleRepository.save(
                                                AppRole.builder().name("ADMIN").scope(RoleScope.UNIVERSITY).build()));
                adminPerms.forEach(p -> adminRole.getPermissions().add(permissionRepository.findByName(p).get()));
                appRoleRepository.save(adminRole);

                AppRole organizerRole = appRoleRepository.findByName("ORGANIZER")
                                .orElseGet(() -> AppRole.builder().name("ORGANIZER").build());
                organizerRole.setScope(RoleScope.UNIVERSITY);
                organizerRole.getPermissions().clear();
                orgPerms.forEach(p -> organizerRole.getPermissions().add(permissionRepository.findByName(p).get()));
                appRoleRepository.save(organizerRole);

                AppRole studentRole = appRoleRepository.findByName("STUDENT")
                                .orElseGet(() -> appRoleRepository.save(
                                                AppRole.builder().name("STUDENT").scope(RoleScope.DEPARTMENT).build()));
                stuPerms.forEach(p -> studentRole.getPermissions().add(permissionRepository.findByName(p).get()));
                appRoleRepository.save(studentRole);

                AppRole volunteerRole = appRoleRepository.findByName("VOLUNTEER")
                                .orElseGet(() -> AppRole.builder().name("VOLUNTEER").build());
                volunteerRole.setScope(RoleScope.DEPARTMENT);
                volunteerRole.getPermissions().clear();
                volPerms.forEach(p -> volunteerRole.getPermissions().add(permissionRepository.findByName(p).get()));
                appRoleRepository.save(volunteerRole);

                // Seed Admin user
                if (!userRepository.existsByEmail("admin@university.edu")) {
                        User admin = User.builder()
                                        .fullName("System Administrator")
                                        .email("admin@university.edu")
                                        .password(passwordEncoder.encode("Admin@123"))
                                        .department(adminDept)
                                        .build();
                        admin.getRoles().add(
                                        UserRole.builder().user(admin).role(adminRole).department(adminDept).build());
                        userRepository.save(admin);
                        log.info("✅ Default admin user created: admin@university.edu / Admin@123");
                }

                // Seed demo Organizer
                if (!userRepository.existsByEmail("organizer@university.edu")) {
                        User organizer = User.builder()
                                        .fullName("Demo Organizer")
                                        .email("organizer@university.edu")
                                        .password(passwordEncoder.encode("Organizer@123"))
                                        .department(affairsDept)
                                        .build();
                        organizer.getRoles().add(UserRole.builder().user(organizer).role(organizerRole)
                                        .department(affairsDept).build());
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
                                        .department(csDept)
                                        .build();
                        student.getRoles().add(
                                        UserRole.builder().user(student).role(studentRole).department(csDept).build());
                        userRepository.save(student);
                        log.info("✅ Default student user created: student@university.edu / Student@123");
                }
        }
}
