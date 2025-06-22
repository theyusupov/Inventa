/*
  Warnings:

  - You are about to drop the column `repaymentPeriod` on the `Debt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Debt" DROP COLUMN "repaymentPeriod",
ADD COLUMN     "remainingMonths" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "monthsPaid" INTEGER;
