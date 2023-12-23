/*
  Warnings:

  - The values [SLOT] on the enum `ExamStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExamStatus_new" AS ENUM ('CLOSED', 'APPLY', 'ENDAPPLY', 'ENDREG', 'PAUSE');
ALTER TABLE "Exam" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Exam" ALTER COLUMN "status" TYPE "ExamStatus_new" USING ("status"::text::"ExamStatus_new");
ALTER TYPE "ExamStatus" RENAME TO "ExamStatus_old";
ALTER TYPE "ExamStatus_new" RENAME TO "ExamStatus";
DROP TYPE "ExamStatus_old";
ALTER TABLE "Exam" ALTER COLUMN "status" SET DEFAULT 'PAUSE';
COMMIT;
