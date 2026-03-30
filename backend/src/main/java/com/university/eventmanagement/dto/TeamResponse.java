package com.university.eventmanagement.dto;

public class TeamResponse {
    private Long id;
    private String name;
    private String description;
    private String purpose;
    private UserBasicDTO createdBy;
    private String createdAt;
    private String position;

    public TeamResponse() {
    }

    public TeamResponse(Long id, String name, String description, String purpose, UserBasicDTO createdBy,
            String createdAt, String position) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.purpose = purpose;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.position = position;
    }

    // Getters and Setters
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public UserBasicDTO getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UserBasicDTO createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    // Builder Pattern
    public static TeamResponseBuilder builder() {
        return new TeamResponseBuilder();
    }

    public static class TeamResponseBuilder {
        private Long id;
        private String name;
        private String description;
        private String purpose;
        private UserBasicDTO createdBy;
        private String createdAt;
        private String position;

        public TeamResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public TeamResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public TeamResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public TeamResponseBuilder purpose(String purpose) {
            this.purpose = purpose;
            return this;
        }

        public TeamResponseBuilder createdBy(UserBasicDTO createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public TeamResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TeamResponseBuilder position(String position) {
            this.position = position;
            return this;
        }

        public TeamResponse build() {
            return new TeamResponse(id, name, description, purpose, createdBy, createdAt, position);
        }
    }
}
