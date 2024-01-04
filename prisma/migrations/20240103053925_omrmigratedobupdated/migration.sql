/*
  Warnings:

  - The `dob` column on the `OMRMigrate` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "OMRMigrate" DROP COLUMN "dob",
ADD COLUMN     "dob" TIMESTAMP(3);
