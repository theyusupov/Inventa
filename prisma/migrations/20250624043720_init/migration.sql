/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Purchase_productId_key" ON "Purchase"("productId");
