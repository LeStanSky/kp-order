-- CreateEnum
CREATE TYPE "DeliveryCategory" AS ENUM ('STANDARD', 'REMOTE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "delivery_category" "DeliveryCategory" NOT NULL DEFAULT 'STANDARD';
