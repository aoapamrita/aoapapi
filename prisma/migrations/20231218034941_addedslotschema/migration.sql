-- CreateTable
CREATE TABLE "Slot" (
    "id" SERIAL NOT NULL,
    "registrationNo" INTEGER NOT NULL,
    "examMode" "ExamCenterMode" NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "examTime" TEXT NOT NULL,
    "selectedCityCode" TEXT NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slot_registrationNo_key" ON "Slot"("registrationNo");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_registrationNo_fkey" FOREIGN KEY ("registrationNo") REFERENCES "Registration"("registrationNo") ON DELETE RESTRICT ON UPDATE CASCADE;
