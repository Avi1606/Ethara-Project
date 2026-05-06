package com.teamtaskmanager.task;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query("""
            select distinct t from Task t
            left join ProjectMember pm on pm.project = t.project
            where t.project.owner.id = :userId or pm.user.id = :userId or t.assignee.id = :userId
            order by t.createdAt desc
            """)
    List<Task> findVisibleForUser(@Param("userId") Long userId);
}
