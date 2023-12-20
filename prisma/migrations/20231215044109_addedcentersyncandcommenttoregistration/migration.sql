-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "centersynccomment" TEXT,
ADD COLUMN     "centersyncstatus" BOOLEAN NOT NULL DEFAULT false;
