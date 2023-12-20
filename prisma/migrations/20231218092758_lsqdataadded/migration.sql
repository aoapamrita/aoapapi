-- CreateTable
CREATE TABLE "LSQ" (
    "id" SERIAL NOT NULL,
    "candidateId" TEXT NOT NULL,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LSQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LSQ_candidateId_key" ON "LSQ"("candidateId");

-- AddForeignKey
ALTER TABLE "LSQ" ADD CONSTRAINT "LSQ_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
