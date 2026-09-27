-- Course review workflow (FR-COURSE-203): submission time and reviewer feedback on each version.

-- AlterTable
ALTER TABLE "course_versions" ADD COLUMN     "review_feedback" VARCHAR(2000),
ADD COLUMN     "submitted_at" TIMESTAMPTZ(3);

