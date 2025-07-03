-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "isArchive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT[],
ADD COLUMN     "pin" BOOLEAN NOT NULL DEFAULT false;
