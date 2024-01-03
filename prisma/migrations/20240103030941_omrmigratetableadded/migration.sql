-- CreateTable
CREATE TABLE "OMRMigrate" (
    "id" SERIAL NOT NULL,
    "registrationNo" INTEGER NOT NULL,
    "fullname" TEXT,
    "gender" TEXT,
    "dob" TEXT,
    "state" INTEGER,
    "phone" TEXT,
    "phonecode" TEXT DEFAULT '+91',
    "category" TEXT,
    "examcity1" INTEGER,
    "examcity2" INTEGER,
    "examcity3" INTEGER,

    CONSTRAINT "OMRMigrate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OMRMigrate_phone_key" ON "OMRMigrate"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "OMRMigrate_registrationNo_key" ON "OMRMigrate"("registrationNo");
