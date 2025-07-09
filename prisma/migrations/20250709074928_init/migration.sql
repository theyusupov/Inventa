/*
  Warnings:

  - You are about to drop the column `monthlyPayment` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `sellPrice` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `startTotal` on the `Contract` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_productId_fkey";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "monthlyPayment",
DROP COLUMN "productId",
DROP COLUMN "quantity",
DROP COLUMN "sellPrice",
DROP COLUMN "startTotal";

-- CreateTable
CREATE TABLE "ContractProduct" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,

    CONSTRAINT "ContractProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContractProduct" ADD CONSTRAINT "ContractProduct_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractProduct" ADD CONSTRAINT "ContractProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
