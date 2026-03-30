package com.university.eventmanagement.dto;

import java.util.List;

public class OrganizerWithTeamsResponse {
    private Long id;
    private String fullName;
    private String email;
    private List<TeamResponse> teams;

    public OrganizerWithTeamsResponse() {
    }

    public OrganizerWithTeamsResponse(Long id, String fullName, String email, List<TeamResponse> teams) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.teams = teams;
    }

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

    public List<TeamResponse> getTeams() {
        return teams;
    }

    public void setTeams(List<TeamResponse> teams) {
        this.teams = teams;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String fullName;
        private String email;
        private List<TeamResponse> teams;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder teams(List<TeamResponse> teams) {
            this.teams = teams;
            return this;
        }

        public OrganizerWithTeamsResponse build() {
            return new OrganizerWithTeamsResponse(id, fullName, email, teams);
        }
    }
}
