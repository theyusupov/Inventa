/*
  Warnings:

  - You are about to drop the column `email` on the `Partner` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Partner_email_key";

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "email";
