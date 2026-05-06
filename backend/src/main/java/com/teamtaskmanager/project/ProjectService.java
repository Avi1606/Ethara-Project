package com.teamtaskmanager.project;

import com.teamtaskmanager.user.Role;
import com.teamtaskmanager.user.User;
import com.teamtaskmanager.user.UserRepository;
import com.teamtaskmanager.user.UserResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            ProjectMemberRepository memberRepository,
            UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(User currentUser) {
        List<Project> projects = currentUser.getRole() == Role.ADMIN
                ? projectRepository.findAll()
                : projectRepository.findVisibleForUser(currentUser.getId());
        return projects.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long id, User currentUser) {
        Project project = findProject(id);
        checkProjectAccess(project, currentUser);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request, User currentUser) {
        requireAdmin(currentUser);

        Project project = new Project();
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setOwner(currentUser);

        Project saved = projectRepository.save(project);
        addMember(saved, currentUser);
        return toResponse(saved);
    }

    @Transactional
    public ProjectResponse addMember(Long projectId, AddMemberRequest request, User currentUser) {
        requireAdmin(currentUser);
        Project project = findProject(projectId);
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        addMember(project, user);
        return toResponse(project);
    }

    private void addMember(Project project, User user) {
        if (!memberRepository.existsByProjectIdAndUserId(project.getId(), user.getId())) {
            ProjectMember member = new ProjectMember();
            member.setProject(project);
            member.setUser(user);
            memberRepository.save(member);
        }
    }

    @Transactional(readOnly = true)
    public void checkProjectAccess(Project project, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        boolean member = memberRepository.existsByProjectIdAndUserId(project.getId(), currentUser.getId());
        if (!member && !project.getOwner().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this project");
        }
    }

    public Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    public void requireAdmin(User user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can perform this action");
        }
    }

    private ProjectResponse toResponse(Project project) {
        List<UserResponse> members = memberRepository.findByProjectId(project.getId()).stream()
                .map(ProjectMember::getUser)
                .map(UserResponse::from)
                .toList();

        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                UserResponse.from(project.getOwner()),
                project.getCreatedAt(),
                members);
    }
}
