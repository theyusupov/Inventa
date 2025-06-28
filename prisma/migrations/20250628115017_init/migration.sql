/*
  Warnings:

  - The `address` column on the `Partner` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Region" AS ENUM ('ANDIJON', 'BUXORO', 'FARGONA', 'JIZZAX', 'XORAZM', 'NAMANGAN', 'NAVOIY', 'QASHQADARYO', 'SAMARQAND', 'SIRDARYO', 'SURXONDARYO', 'TOSHKENT');

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "address",
ADD COLUMN     "address" "Region";
