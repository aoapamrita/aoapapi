-- CreateTable
CREATE TABLE "AdmitCard" (
    "id" SERIAL NOT NULL,
    "registrationNo" INTEGER NOT NULL,
    "examMode" "ExamCenterMode" NOT NULL,
    "locationName" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "examTime" TEXT NOT NULL,
    "locationAddress" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,

    CONSTRAINT "AdmitCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdmitCard_registrationNo_key" ON "AdmitCard"("registrationNo");

-- AddForeignKey
ALTER TABLE "AdmitCard" ADD CONSTRAINT "AdmitCard_registrationNo_fkey" FOREIGN KEY ("registrationNo") REFERENCES "Registration"("registrationNo") ON DELETE RESTRICT ON UPDATE CASCADE;
