package com.teamtaskmanager.project;

import jakarta.validation.constraints.NotNull;

public class AddMemberRequest {
    @NotNull
    private Long userId;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
