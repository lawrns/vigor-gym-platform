-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('active', 'invited', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."PriceType" AS ENUM ('fixed', 'custom');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('monthly', 'annual', 'custom');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('active', 'trial', 'paused', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('reserved', 'checked_in', 'no_show', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'void');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('stripe', 'mercadopago');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('requires_action', 'succeeded', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "billing_email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."members" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "status" "public"."MemberStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_type" "public"."PriceType" NOT NULL,
    "price_mxn_cents" INTEGER,
    "billing_cycle" "public"."BillingCycle" NOT NULL,
    "features_json" JSONB,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memberships" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gyms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visits" (
    "id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "check_in" TIMESTAMPTZ NOT NULL,
    "check_out" TIMESTAMPTZ,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."classes" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'reserved',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "cfdi_uuid" TEXT,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'draft',
    "total_mxn_cents" INTEGER NOT NULL,
    "issued_at" TIMESTAMPTZ,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "provider_ref" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'requires_action',
    "paid_mxn_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_rfc_key" ON "public"."companies"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "public"."members"("email");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "public"."members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "public"."plans"("code");

-- CreateIndex
CREATE INDEX "visits_membership_id_check_in_idx" ON "public"."visits"("membership_id", "check_in");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_cfdi_uuid_key" ON "public"."invoices"("cfdi_uuid");

-- AddForeignKey
ALTER TABLE "public"."members" ADD CONSTRAINT "members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
