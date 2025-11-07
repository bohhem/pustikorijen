-- CreateEnum
CREATE TYPE "BackupScope" AS ENUM ('FULL', 'REGION');
CREATE TYPE "BackupStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "backup_snapshots" (
  "backup_id" TEXT NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "scope" "BackupScope" NOT NULL DEFAULT 'FULL',
  "region_id" TEXT,
  "include_media" BOOLEAN NOT NULL DEFAULT true,
  "status" "BackupStatus" NOT NULL DEFAULT 'QUEUED',
  "storage_path" TEXT,
  "size_bytes" BIGINT,
  "checksum" TEXT,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ,
  "initiated_by" TEXT NOT NULL,
  "retention_days" INTEGER NOT NULL DEFAULT 30,
  "notify_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "metadata" JSONB,
  "source_env" VARCHAR(50),
  CONSTRAINT "backup_snapshots_pkey" PRIMARY KEY ("backup_id"),
  CONSTRAINT "backup_snapshots_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "admin_regions"("region_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "backup_snapshots_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "backup_snapshots_scope_idx" ON "backup_snapshots"("scope");
CREATE INDEX "backup_snapshots_status_idx" ON "backup_snapshots"("status");
CREATE INDEX "backup_snapshots_started_at_idx" ON "backup_snapshots"("started_at" DESC);
