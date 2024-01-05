-- CreateTable
CREATE TABLE "SlotMailStatus" (
    "id" SERIAL NOT NULL,
    "registrationId" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SlotMailStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlotMailStatus_registrationId_key" ON "SlotMailStatus"("registrationId");

-- AddForeignKey
ALTER TABLE "SlotMailStatus" ADD CONSTRAINT "SlotMailStatus_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
