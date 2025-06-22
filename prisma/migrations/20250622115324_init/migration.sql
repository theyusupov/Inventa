-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ONGOING', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "status" "ContractStatus";
