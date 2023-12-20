/*
  Warnings:

  - A unique constraint covering the columns `[registrationNo]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Registration_registrationNo_key" ON "Registration"("registrationNo");
