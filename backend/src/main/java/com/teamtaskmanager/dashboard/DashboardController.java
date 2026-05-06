package com.teamtaskmanager.dashboard;

import com.teamtaskmanager.project.ProjectService;
import com.teamtaskmanager.task.TaskResponse;
import com.teamtaskmanager.task.TaskService;
import com.teamtaskmanager.task.TaskStatus;
import com.teamtaskmanager.user.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ProjectService projectService;
    private final TaskService taskService;

    public DashboardController(ProjectService projectService, TaskService taskService) {
        this.projectService = projectService;
        this.taskService = taskService;
    }

    @GetMapping
    public DashboardResponse dashboard(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<TaskResponse> tasks = taskService.list(null, currentUser);
        LocalDate today = LocalDate.now();

        long todo = tasks.stream().filter(task -> task.status() == TaskStatus.TODO).count();
        long progress = tasks.stream().filter(task -> task.status() == TaskStatus.IN_PROGRESS).count();
        long done = tasks.stream().filter(task -> task.status() == TaskStatus.DONE).count();
        long overdue = tasks.stream()
                .filter(task -> task.dueDate() != null)
                .filter(task -> task.status() != TaskStatus.DONE)
                .filter(task -> task.dueDate().isBefore(today))
                .count();

        return new DashboardResponse(
                projectService.list(currentUser).size(),
                tasks.size(),
                todo,
                progress,
                done,
                overdue);
    }
}
