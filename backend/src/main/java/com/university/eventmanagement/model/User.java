package com.university.eventmanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "studentId")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String fullName;

    @NotBlank
    @Email
    @Size(max = 150)
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Size(max = 50)
    @Column(unique = true)
    private String studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_clubs", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "club_id"))
    private Set<Club> clubs = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = true)
    private UserStatus status = UserStatus.ACTIVE;

    @Size(max = 15)
    private String phone;

    @Column(name = "profile_picture")
    private String profilePicture;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<UserRole> roles = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean faceEnrolled = false;

    private Integer failedScanAttempts = 0;

    private LocalDateTime updatedAt;

    public User() {
    }

    public User(Long id, String fullName, String email, String password, String studentId, Department department,
            Set<Club> clubs, UserStatus status, String phone, String profilePicture, Set<UserRole> roles,
            LocalDateTime createdAt, boolean faceEnrolled, Integer failedScanAttempts, LocalDateTime updatedAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.studentId = studentId;
        this.department = department;
        this.clubs = clubs != null ? clubs : new HashSet<>();
        this.status = status != null ? status : UserStatus.ACTIVE;
        this.phone = phone;
        this.profilePicture = profilePicture;
        this.roles = roles != null ? roles : new HashSet<>();
        this.createdAt = createdAt;
        this.faceEnrolled = faceEnrolled;
        this.failedScanAttempts = failedScanAttempts != null ? failedScanAttempts : 0;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getPrimaryRoleName() {
        if (roles == null || roles.isEmpty())
            return "STUDENT";
        boolean hasOrganizer = false;
        for (UserRole ur : roles) {
            if (ur.getRole() != null) {
                String rn = ur.getRole().getName();
                if ("ADMIN".equals(rn))
                    return "ADMIN";
                if ("ORGANIZER".equals(rn))
                    hasOrganizer = true;
            }
        }
        return hasOrganizer ? "ORGANIZER" : "STUDENT";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Set<Club> getClubs() {
        return clubs;
    }

    public void setClubs(Set<Club> clubs) {
        this.clubs = clubs;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Set<UserRole> getRoles() {
        return roles;
    }

    public void setRoles(Set<UserRole> roles) {
        this.roles = roles;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isFaceEnrolled() {
        return faceEnrolled;
    }

    public void setFaceEnrolled(boolean faceEnrolled) {
        this.faceEnrolled = faceEnrolled;
    }

    public Integer getFailedScanAttempts() {
        return failedScanAttempts;
    }

    public void setFailedScanAttempts(Integer failedScanAttempts) {
        this.failedScanAttempts = failedScanAttempts;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String fullName;
        private String email;
        private String password;
        private String studentId;
        private Department department;
        private Set<Club> clubs = new HashSet<>();
        private UserStatus status = UserStatus.ACTIVE;
        private String phone;
        private String profilePicture;
        private Set<UserRole> roles = new HashSet<>();
        private LocalDateTime createdAt;
        private boolean faceEnrolled = false;
        private Integer failedScanAttempts = 0;
        private LocalDateTime updatedAt;

        UserBuilder() {
        }

        public UserBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserBuilder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }

        public UserBuilder department(Department department) {
            this.department = department;
            return this;
        }

        public UserBuilder clubs(Set<Club> clubs) {
            this.clubs = clubs;
            return this;
        }

        public UserBuilder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public UserBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public UserBuilder profilePicture(String profilePicture) {
            this.profilePicture = profilePicture;
            return this;
        }

        public UserBuilder roles(Set<UserRole> roles) {
            this.roles = roles;
            return this;
        }

        public UserBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserBuilder faceEnrolled(boolean faceEnrolled) {
            this.faceEnrolled = faceEnrolled;
            return this;
        }

        public UserBuilder failedScanAttempts(Integer failedScanAttempts) {
            this.failedScanAttempts = failedScanAttempts;
            return this;
        }

        public UserBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public User build() {
            return new User(id, fullName, email, password, studentId, department, clubs, status, phone, profilePicture,
                    roles, createdAt, faceEnrolled, failedScanAttempts, updatedAt);
        }
    }
}
