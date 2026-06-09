package com.edusphere.audit.repository;

import com.edusphere.audit.entity.ComplianceReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComplianceReportRepository extends JpaRepository<ComplianceReport, UUID> {

    List<ComplianceReport> findAllByOrderByGeneratedAtDesc();

    Optional<ComplianceReport> findById(UUID reportId);
}
