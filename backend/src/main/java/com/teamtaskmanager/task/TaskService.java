package com.teamtaskmanager.task;

import com.teamtaskmanager.project.Project;
import com.teamtaskmanager.project.ProjectService;
import com.teamtaskmanager.user.Role;
import com.teamtaskmanager.user.User;
import com.teamtaskmanager.user.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(Long projectId, User currentUser) {
        List<Task> tasks;
        if (projectId != null) {
            Project project = projectService.findProject(projectId);
            projectService.checkProjectAccess(project, currentUser);
            tasks = taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        } else if (currentUser.getRole() == Role.ADMIN) {
            tasks = taskRepository.findAll();
        } else {
            tasks = taskRepository.findVisibleForUser(currentUser.getId());
        }
        return tasks.stream().map(TaskResponse::from).toList();
    }

    @Transactional
    public TaskResponse create(TaskRequest request, User currentUser) {
        projectService.requireAdmin(currentUser);

        Project project = projectService.findProject(request.getProjectId());
        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));

        Task task = new Task();
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        task.setProject(project);
        task.setAssignee(assignee);
        task.setCreatedBy(currentUser);

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long taskId, StatusUpdateRequest request, User currentUser) {
        Task task = findTask(taskId);
        boolean assignedMember = task.getAssignee().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !assignedMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own task status");
        }

        task.setStatus(request.getStatus());
        return TaskResponse.from(taskRepository.save(task));
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }
}
