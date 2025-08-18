/*
  Warnings:

  - Added the required column `company_id` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('card', 'bank_account', 'wallet');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('owner', 'manager', 'staff', 'member', 'partner_admin');

-- AlterEnum
ALTER TYPE "public"."MembershipStatus" ADD VALUE 'draft';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."memberships" DROP CONSTRAINT "memberships_member_id_fkey";

-- AlterTable
ALTER TABLE "public"."companies" ADD COLUMN     "industry" TEXT,
ADD COLUMN     "plan_id" UUID,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
ADD COLUMN     "updated_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."memberships" ADD COLUMN     "company_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "member_id" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'draft',
ALTER COLUMN "starts_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."plans" ADD COLUMN     "mp_price_id" TEXT,
ADD COLUMN     "stripe_price_id" TEXT;

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'member',
    "company_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "member_id" UUID,
    "type" "public"."PaymentMethodType" NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "stripe_payment_method_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "public"."users"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_idx" ON "public"."subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_external_id_key" ON "public"."subscriptions"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_stripe_payment_method_id_key" ON "public"."payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "payment_methods_company_id_idx" ON "public"."payment_methods"("company_id");

-- CreateIndex
CREATE INDEX "payment_methods_member_id_idx" ON "public"."payment_methods"("member_id");

-- CreateIndex
CREATE INDEX "payment_methods_is_default_idx" ON "public"."payment_methods"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "public"."webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "webhook_events_provider_processed_idx" ON "public"."webhook_events"("provider", "processed");

-- CreateIndex
CREATE INDEX "memberships_company_id_status_idx" ON "public"."memberships"("company_id", "status");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
