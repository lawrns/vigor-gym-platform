-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('ADMIN', 'TRAINER', 'RECEPTIONIST', 'MANAGER', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "public"."staff" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "hire_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_shifts" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "gym_id" UUID,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_certifications" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "obtained_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "public"."staff"("email");

-- CreateIndex
CREATE INDEX "staff_company_id_idx" ON "public"."staff"("company_id");

-- CreateIndex
CREATE INDEX "staff_email_idx" ON "public"."staff"("email");

-- CreateIndex
CREATE INDEX "staff_role_idx" ON "public"."staff"("role");

-- CreateIndex
CREATE INDEX "staff_shifts_staff_id_idx" ON "public"."staff_shifts"("staff_id");

-- CreateIndex
CREATE INDEX "staff_shifts_gym_id_idx" ON "public"."staff_shifts"("gym_id");

-- CreateIndex
CREATE INDEX "staff_shifts_start_time_idx" ON "public"."staff_shifts"("start_time");

-- CreateIndex
CREATE INDEX "staff_certifications_staff_id_idx" ON "public"."staff_certifications"("staff_id");

-- CreateIndex
CREATE INDEX "staff_certifications_expires_at_idx" ON "public"."staff_certifications"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."staff" ADD CONSTRAINT "staff_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_shifts" ADD CONSTRAINT "staff_shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_shifts" ADD CONSTRAINT "staff_shifts_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."staff_certifications" ADD CONSTRAINT "staff_certifications_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
