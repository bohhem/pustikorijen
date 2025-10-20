-- Ensure UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for user global roles
CREATE TYPE "UserGlobalRole" AS ENUM ('USER', 'SUPER_GURU', 'ADMIN');

-- Add global_role column to users
ALTER TABLE "users"
  ADD COLUMN "global_role" "UserGlobalRole" NOT NULL DEFAULT 'USER';

-- Create admin_regions table
CREATE TABLE "admin_regions" (
  "region_id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(150) NOT NULL,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "description" TEXT,
  "country" VARCHAR(100),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX "admin_regions_code_idx" ON "admin_regions" ("code");

-- Add admin_region_id to family_branches
ALTER TABLE "family_branches"
  ADD COLUMN "admin_region_id" TEXT;

CREATE INDEX "family_branches_admin_region_idx" ON "family_branches" ("admin_region_id");

ALTER TABLE "family_branches"
  ADD CONSTRAINT "family_branches_admin_region_id_fkey"
  FOREIGN KEY ("admin_region_id") REFERENCES "admin_regions"("region_id") ON DELETE SET NULL;

-- Create super_guru_assignments table
CREATE TABLE "super_guru_assignments" (
  "assignment_id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" TEXT NOT NULL,
  "region_id" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_by" TEXT,
  CONSTRAINT "super_guru_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
  CONSTRAINT "super_guru_assignments_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "admin_regions"("region_id") ON DELETE CASCADE,
  CONSTRAINT "super_guru_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "super_guru_assignments_user_region_unique" ON "super_guru_assignments" ("user_id", "region_id");
CREATE INDEX "super_guru_assignments_region_idx" ON "super_guru_assignments" ("region_id");

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_admin_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_regions_updated_at
BEFORE UPDATE ON "admin_regions"
FOR EACH ROW EXECUTE FUNCTION set_admin_regions_updated_at();
