/*
  Warnings:

  - You are about to drop the column `buyPrice` on the `Contract` table. All the data in the column will be lost.
  - Made the column `sellPrice` on table `Contract` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "buyPrice",
ALTER COLUMN "sellPrice" SET NOT NULL;
