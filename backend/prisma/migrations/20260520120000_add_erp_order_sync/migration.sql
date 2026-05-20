-- CreateEnum
CREATE TYPE "ErpSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "external_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "erp_id" TEXT,
ADD COLUMN "erp_number" TEXT,
ADD COLUMN "erp_sync_status" "ErpSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "erp_synced_at" TIMESTAMP(3),
ADD COLUMN "erp_error" TEXT,
ADD COLUMN "erp_retry_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");
