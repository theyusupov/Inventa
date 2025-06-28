/*
  Warnings:

  - The values [ANDIJON,BUXORO,FARGONA,JIZZAX,XORAZM,NAMANGAN,NAVOIY,QASHQADARYO,SAMARQAND,SIRDARYO,SURXONDARYO,TOSHKENT] on the enum `Region` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Region_new" AS ENUM ('Andijon', 'Buxoro', 'Fargona', 'Jizzax', 'Xorazm', 'Namangan', 'Navoiy', 'Qashqadaryo', 'Samarqand', 'Sirdaryo', 'Surxondaryo', 'Toshkent');
ALTER TABLE "Partner" ALTER COLUMN "address" TYPE "Region_new" USING ("address"::text::"Region_new");
ALTER TYPE "Region" RENAME TO "Region_old";
ALTER TYPE "Region_new" RENAME TO "Region";
DROP TYPE "Region_old";
COMMIT;
