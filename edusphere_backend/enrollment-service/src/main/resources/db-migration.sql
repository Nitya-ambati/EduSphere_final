-- Run this once against your edusphere_enrollment database to fix the status column.
-- The column may have been created as ENUM instead of VARCHAR, which causes
-- "Data truncated for column 'status'" when inserting PENDING or COMPLETED values.

ALTER TABLE enrollments
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
