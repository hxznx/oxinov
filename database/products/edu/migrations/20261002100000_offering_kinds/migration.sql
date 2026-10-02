-- Offering kinds and store categories (ADR-028 point 1; FR-CATALOG-306, FR-CATALOG-310).
-- Every course becomes an offering with a kind (course, training, idea, think-tank research, or short
-- skill) and a store category that groups it on the store home. Additive only: existing courses become
-- COURSE in OTHER until the administrator sets them in Oxinov Studio.

-- CreateEnum
CREATE TYPE "offering_kind" AS ENUM ('COURSE', 'TRAINING', 'IDEA', 'THINK_TANK', 'SKILL');

-- CreateEnum
CREATE TYPE "offering_category" AS ENUM ('LANGUAGES', 'TECHNOLOGY', 'IDEAS_RESEARCH', 'OTHER');

-- AlterTable
ALTER TABLE "courses"
    ADD COLUMN "kind" "offering_kind" NOT NULL DEFAULT 'COURSE',
    ADD COLUMN "category" "offering_category" NOT NULL DEFAULT 'OTHER';
