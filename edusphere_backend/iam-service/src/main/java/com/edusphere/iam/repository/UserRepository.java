package com.edusphere.iam.repository;

import com.edusphere.iam.entity.User;
import com.edusphere.iam.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailAndDeletedFalse(String email);

    // Used by bulk import to find users including soft-deleted ones (for reactivation)
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Cannot use derived query - Spring Data JPA treats "Or" in
    // "StudentOrEmployeeId" as a logical OR operator. Use @Query instead.
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END " +
           "FROM User u WHERE u.studentOrEmployeeId = :empStudentId AND u.deleted = false")
    boolean existsByStudentOrEmployeeId(@Param("empStudentId") String empStudentId);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END " +
           "FROM User u WHERE u.studentOrEmployeeId = :empStudentId AND u.userId != :userId")
    boolean existsByStudentOrEmployeeIdAndUserIdNot(@Param("empStudentId") String empStudentId, @Param("userId") UUID userId);

    List<User> findByRoleAndDeletedFalse(Role role);

    List<User> findByDepartmentIdAndDeletedFalse(UUID departmentId);

    @Query("SELECT u FROM User u WHERE u.studentOrEmployeeId = :empId AND u.deleted = false")
    Optional<User> findByStudentOrEmployeeIdAndDeletedFalse(@Param("empId") String empId);
}
