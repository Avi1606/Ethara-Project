package com.teamtaskmanager.project;

import com.teamtaskmanager.user.UserResponse;
import java.time.LocalDateTime;
import java.util.List;

public record ProjectResponse(
        Long id,
        String name,
        String description,
        UserResponse owner,
        LocalDateTime createdAt,
        List<UserResponse> members) {
}
