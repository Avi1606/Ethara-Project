package com.teamtaskmanager.project;

import com.teamtaskmanager.user.User;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectResponse> list(Authentication authentication) {
        return projectService.list((User) authentication.getPrincipal());
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable Long id, Authentication authentication) {
        return projectService.get(id, (User) authentication.getPrincipal());
    }

    @PostMapping
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request, Authentication authentication) {
        return projectService.create(request, (User) authentication.getPrincipal());
    }

    @PostMapping("/{id}/members")
    public ProjectResponse addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request,
            Authentication authentication) {
        return projectService.addMember(id, request, (User) authentication.getPrincipal());
    }
}
