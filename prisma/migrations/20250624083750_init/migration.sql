/*
  Warnings:

  - You are about to alter the column `monthlyPayment` on the `Contract` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "monthlyPayment" SET DATA TYPE INTEGER;
