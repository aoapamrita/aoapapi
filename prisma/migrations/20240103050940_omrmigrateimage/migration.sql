/*
  Warnings:

  - You are about to drop the column `folder` on the `OMRMigrate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OMRMigrate" DROP COLUMN "folder",
ADD COLUMN     "image" BYTEA;
