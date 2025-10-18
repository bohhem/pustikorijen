-- CreateTable
CREATE TABLE "partnerships" (
    "partnership_id" TEXT NOT NULL,
    "branch_id" VARCHAR(50) NOT NULL,
    "person1_id" TEXT NOT NULL,
    "person2_id" TEXT NOT NULL,
    "partnership_type" VARCHAR(50) NOT NULL DEFAULT 'marriage',
    "start_date" DATE,
    "start_place" VARCHAR(255),
    "end_date" DATE,
    "end_place" VARCHAR(255),
    "end_reason" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "order_number" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "ceremony_type" VARCHAR(100),
    "created_by" TEXT,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "verification_level" INTEGER NOT NULL DEFAULT 1,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'family_only',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnerships_pkey" PRIMARY KEY ("partnership_id")
);

-- CreateIndex
CREATE INDEX "partnerships_branch_id_idx" ON "partnerships"("branch_id");

-- CreateIndex
CREATE INDEX "partnerships_person1_id_idx" ON "partnerships"("person1_id");

-- CreateIndex
CREATE INDEX "partnerships_person2_id_idx" ON "partnerships"("person2_id");

-- CreateIndex
CREATE INDEX "partnerships_status_idx" ON "partnerships"("status");

-- CreateIndex
CREATE INDEX "partnerships_start_date_idx" ON "partnerships"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "partnerships_person1_id_person2_id_order_number_key" ON "partnerships"("person1_id", "person2_id", "order_number");

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "family_branches"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_person1_id_fkey" FOREIGN KEY ("person1_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_person2_id_fkey" FOREIGN KEY ("person2_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
