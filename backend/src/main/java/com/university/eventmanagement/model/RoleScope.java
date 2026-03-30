package com.university.eventmanagement.model;

public enum RoleScope {
    CLUB(1),
    DEPARTMENT(2),
    UNIVERSITY(3);

    private final int level;

    RoleScope(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}
