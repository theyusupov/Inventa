/*
  Warnings:

  - The `location` column on the `Partner` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "location",
ADD COLUMN     "location" JSONB[];
