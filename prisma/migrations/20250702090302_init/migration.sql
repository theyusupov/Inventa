/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `Partner` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Partner_phoneNumber_key";

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "phoneNumber",
ADD COLUMN     "phoneNumbers" TEXT[];
