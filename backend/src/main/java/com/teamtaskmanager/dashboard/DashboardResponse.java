package com.teamtaskmanager.dashboard;

public record DashboardResponse(
        long totalProjects,
        long totalTasks,
        long todoTasks,
        long inProgressTasks,
        long doneTasks,
        long overdueTasks) {
}
