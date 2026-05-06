package com.teamtaskmanager.task;

import com.teamtaskmanager.user.UserResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskStatus status,
        LocalDate dueDate,
        Long projectId,
        String projectName,
        UserResponse assignee,
        UserResponse createdBy,
        LocalDateTime createdAt) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getDueDate(),
                task.getProject().getId(),
                task.getProject().getName(),
                UserResponse.from(task.getAssignee()),
                UserResponse.from(task.getCreatedBy()),
                task.getCreatedAt());
    }
}
