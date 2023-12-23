-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "phaseenddate" TIMESTAMP(3),
ADD COLUMN     "phaseno" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slotstatus" BOOLEAN NOT NULL DEFAULT false;
