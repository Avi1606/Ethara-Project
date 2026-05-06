package com.teamtaskmanager.task;

import jakarta.validation.constraints.NotNull;

public class StatusUpdateRequest {
    @NotNull
    private TaskStatus status;

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }
}
