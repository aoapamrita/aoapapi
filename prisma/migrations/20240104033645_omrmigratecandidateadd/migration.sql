-- AlterTable
ALTER TABLE "OMRMigrate" ADD COLUMN     "candidateId" TEXT;

-- AddForeignKey
ALTER TABLE "OMRMigrate" ADD CONSTRAINT "OMRMigrate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
