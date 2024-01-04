/*
  Warnings:

  - You are about to drop the column `image` on the `OMRMigrate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OMRMigrate" DROP COLUMN "image",
ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "sign" BYTEA;
