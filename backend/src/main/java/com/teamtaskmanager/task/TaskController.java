package com.teamtaskmanager.task;

import com.teamtaskmanager.user.User;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> list(@RequestParam(required = false) Long projectId, Authentication authentication) {
        return taskService.list(projectId, (User) authentication.getPrincipal());
    }

    @PostMapping
    public TaskResponse create(@Valid @RequestBody TaskRequest request, Authentication authentication) {
        return taskService.create(request, (User) authentication.getPrincipal());
    }

    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        return taskService.updateStatus(id, request, (User) authentication.getPrincipal());
    }
}
