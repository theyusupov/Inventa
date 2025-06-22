/*
  Warnings:

  - You are about to drop the `ProductActionHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RETURNED', 'PAYMENT', 'LOGIN', 'RESET_PASSWORD');

-- DropForeignKey
ALTER TABLE "ProductActionHistory" DROP CONSTRAINT "ProductActionHistory_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductActionHistory" DROP CONSTRAINT "ProductActionHistory_userId_fkey";

-- DropTable
DROP TABLE "ProductActionHistory";

-- CreateTable
CREATE TABLE "ActionHistory" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "userId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
