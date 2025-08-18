-- AlterTable
ALTER TABLE "public"."visits" ADD COLUMN     "device_id" UUID;

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "device_secret_hash" TEXT NOT NULL,
    "last_seen_at" TIMESTAMPTZ,
    "location_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_sessions" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "jwt_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "devices_company_id_idx" ON "public"."devices"("company_id");

-- CreateIndex
CREATE INDEX "devices_last_seen_at_idx" ON "public"."devices"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_sessions_jwt_id_key" ON "public"."device_sessions"("jwt_id");

-- CreateIndex
CREATE INDEX "device_sessions_device_id_idx" ON "public"."device_sessions"("device_id");

-- CreateIndex
CREATE INDEX "device_sessions_expires_at_idx" ON "public"."device_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "visits_device_id_idx" ON "public"."visits"("device_id");

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_sessions" ADD CONSTRAINT "device_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
