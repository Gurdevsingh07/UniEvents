package com.university.eventmanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
public class AppRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name; // e.g., 'ADMIN', 'ORGANIZER', 'STUDENT', 'VOLUNTEER'

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleScope scope;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"), inverseJoinColumns = @JoinColumn(name = "perm_id"))
    private Set<Permission> permissions = new HashSet<>();

    private Long createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public AppRole() {
    }

    public AppRole(Long id, String name, RoleScope scope, Set<Permission> permissions, Long createdBy,
            LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.scope = scope;
        this.permissions = permissions != null ? permissions : new HashSet<>();
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RoleScope getScope() {
        return scope;
    }

    public void setScope(RoleScope scope) {
        this.scope = scope;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static AppRoleBuilder builder() {
        return new AppRoleBuilder();
    }

    public static class AppRoleBuilder {
        private Long id;
        private String name;
        private RoleScope scope;
        private Set<Permission> permissions = new HashSet<>();
        private Long createdBy;
        private LocalDateTime createdAt;

        AppRoleBuilder() {
        }

        public AppRoleBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AppRoleBuilder name(String name) {
            this.name = name;
            return this;
        }

        public AppRoleBuilder scope(RoleScope scope) {
            this.scope = scope;
            return this;
        }

        public AppRoleBuilder permissions(Set<Permission> permissions) {
            this.permissions = permissions;
            return this;
        }

        public AppRoleBuilder createdBy(Long createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public AppRoleBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AppRole build() {
            return new AppRole(id, name, scope, permissions, createdBy, createdAt);
        }
    }
}
