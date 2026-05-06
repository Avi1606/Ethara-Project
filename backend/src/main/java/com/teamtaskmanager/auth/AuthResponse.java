package com.teamtaskmanager.auth;

import com.teamtaskmanager.user.UserResponse;

public record AuthResponse(String token, UserResponse user) {
}
