package com.edusphere.analytics.repository;

import com.edusphere.analytics.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    List<Report> findByGeneratedByOrderByCreatedAtDesc(UUID generatedBy);

    List<Report> findAllByOrderByCreatedAtDesc();

    Optional<Report> findByReportIdAndDeletedFalse(UUID reportId);
}
