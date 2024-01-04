-- AlterTable
ALTER TABLE "OMRMigrate" ADD COLUMN     "examapplicationId" TEXT;

-- AddForeignKey
ALTER TABLE "OMRMigrate" ADD CONSTRAINT "OMRMigrate_examapplicationId_fkey" FOREIGN KEY ("examapplicationId") REFERENCES "ExamApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
