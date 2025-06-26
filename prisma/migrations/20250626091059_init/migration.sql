-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_debtId_fkey";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "debtId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
