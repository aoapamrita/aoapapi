import AdmZip from "adm-zip";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import prisma from "../../db";
import { v2 as cloudinary } from "cloudinary";
import mainqueue from "../../queue";
import { InternalServerError } from "../../errors/internal-server-error";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryResult {
  public_id: string;
}

enum ExamApplicationType {
  ONLINE = "ONLINE",
  OMR = "OMR",
  AGENT = "AGENT",
}

enum ExamApplicationStatus {
  PENDING = "PENDING",
  APPLIED = "APPLIED",
  REGISTERED = "REGISTERED",
  SLOT = "SLOT",
  ADMIT = "ADMIT",
  RANK = "RANK",
}

export const handleOmrUpload = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name 'file' below should match the name attribute in your HTML form
  let uploadedFile = req.files.file;
  let uploadbasefolder = "./uploads/";
  let extractedbasefolder = "extracted";

  let uploadfoldername = `omr_${Date.now()}`;

  let uploadfilepath = `${uploadbasefolder}/${uploadfoldername}.zip`;
  let extractedfoldername = `${extractedbasefolder}/${uploadfoldername}`;
  // Use the mv() method to place the file in upload directory
  uploadedFile.mv(uploadfilepath, async function (err) {
    if (err) return res.status(500).send(err);

    // Extract the ZIP file
    const zip = new AdmZip(uploadfilepath);
    zip.extractAllTo(extractedfoldername, true);

    const photodir = fs
      .readdirSync(extractedfoldername, { withFileTypes: true })
      .find((dir) => dir.isDirectory()).name;

    const excelFiles = fs
      .readdirSync(extractedfoldername)
      .filter((file) => file.endsWith(".xlsx") || file.endsWith(".xls"));

    if (excelFiles.length === 0) {
      return res.status(400).send("No Excel files found in the ZIP.");
    }

    const workbook = xlsx.readFile(
      path.join(extractedfoldername, excelFiles[0])
    );

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, {
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    const rows = [];

    for (const row of data) {
      const registrationNo = parseInt(row["Appl_no"]);
      const fullname = row["CandidateName"].trim();
      const gender = row["Gender"];
      const dob = new Date(row["DOB"]);
      const state = parseInt(row["State_Code"]);
      const phone = row["MobileNo"];
      const category = row["Category"];
      const examcity1 = parseInt(row["CentreChoice_1_Code"]);
      const examcity2 = parseInt(row["CentreChoice_2_Code"]);
      const examcity3 = parseInt(row["CentreChoice_3_Code"]);
      const photopath = path.join(
        process.cwd(),
        extractedfoldername,
        photodir,
        `${registrationNo}_photo.jpg`
      );
      const signpath = path.join(
        process.cwd(),
        extractedfoldername,
        photodir,
        `${registrationNo}_sign.jpg`
      );

      // Read files into Buffers
      const photoBuffer = fs.existsSync(photopath)
        ? fs.readFileSync(photopath)
        : null;
      const signBuffer = fs.existsSync(signpath)
        ? fs.readFileSync(signpath)
        : null;

      const dbData = {
        registrationNo,
        fullname,
        gender,
        dob,
        state,
        phone,
        category,
        examcity1,
        examcity2,
        examcity3,
        photo: photoBuffer,
        sign: signBuffer,
      };

      try {
        await prisma.oMRMigrate.upsert({
          where: { registrationNo },
          update: dbData,
          create: dbData,
        });
      } catch (error) {
        console.log(error);
      }
    }

    fs.unlinkSync(uploadfilepath);
    fs.rmSync(extractedfoldername, { recursive: true });

    return res.json(rows);
  });
};

export const handleSyncCandidates = async (req, res) => {
  // get all candidates from omrmigrate table

  try {
    // Check if a similar job is already in the queue
    const jobs = await mainqueue.getJobs([
      "waiting",
      "active",
      "delayed",
      "paused",
    ]);

    console.log(jobs);

    const isJobAlreadyQueued = jobs.some(
      (job) => job.name === "syncingOmrCandidates"
    );

    console.log("job already queued", isJobAlreadyQueued);

    if (isJobAlreadyQueued) {
      return res.status(400).json({
        message:
          "A verification job for this exam is already queued or in progress.",
      });
    }

    // Enqueue a single job for verifying all candidates
    await mainqueue.add("syncingOmrCandidates", {});

    return res.json({
      message: "Data for all OMR candidates to be synced enqueued",
    });
  } catch (error) {
    console.error(`Error in syncingOmrCandidates: ${error.message}`);
    throw new InternalServerError("Error in verifying");
  }
};

export const syncingOmrCandidates = async (data) => {
  try {
    const omrcandidates = await prisma.oMRMigrate.findMany();
    for (const omrcandidate of omrcandidates) {
      let candidate = await createCandidate(omrcandidate);
      console.log("candidate", candidate?.fullname);
      if (candidate) {
        const isOnboarding = await createOnboarding(candidate);
        console.log("onboarding", isOnboarding);
        if (isOnboarding) {
          const isPlusTwo = await createPlusTwoInfo(candidate, omrcandidate);
          console.log("isPlusTwo", isPlusTwo);
          if (isPlusTwo) {
            const application = await createCanApplication(
              candidate,
              omrcandidate
            );
            console.log("application", application?.id);
            if (application) {
              if (application.status === "PENDING") {
                const isApplicationJee = await createApplicationJEE(
                  application
                );
                if (isApplicationJee) {
                  const isApplicationCities = await createApplicationCities(
                    application,
                    omrcandidate
                  );
                  if (isApplicationCities) {
                    // update application status to applied
                    await prisma.examApplication.update({
                      where: {
                        id: application.id,
                      },
                      data: {
                        status: "APPLIED",
                      },
                    });
                  }
                }
              }
              // update omr with application id
              await prisma.oMRMigrate.update({
                where: {
                  id: omrcandidate.id,
                },
                data: {
                  examapplicationId: application.id,
                  comment: null,
                },
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `Error in worker processing verifyAllCandidates: ${error.message}`
    );
  }
};

const createCandidate = async (omrcandidate) => {
  // check if omrcandidate has candidate id
  // if so get the candidate and return it
  let candidate = null;
  if (omrcandidate.candidateId) {
    candidate = await prisma.candidate.findUnique({
      where: {
        id: omrcandidate.candidateId,
      },
    });
  } else {
    if (omrcandidate.phone && omrcandidate.examcity1) {
      const candidateExists = await prisma.candidate.findUnique({
        where: {
          phone: omrcandidate.phone,
        },
      });
      if (candidateExists) {
        await updateOMRComment(omrcandidate.id, "Candidate already exists");
      } else {
        const gender = await prisma.gender.findFirst({
          where: {
            name: {
              equals: omrcandidate.gender,
              mode: "insensitive",
            },
          },
        });
        // get state from state code
        const state = await prisma.state.findFirst({
          where: {
            code: omrcandidate.state,
          },
        });
        const socialstatus = await prisma.socialStatus.findFirst({
          where: {
            name: {
              equals: omrcandidate.category,
              mode: "insensitive",
            },
          },
        });
        let candidatecreatestatus = true;
        let creationfailmssg = "Not Enough Information";
        let candidatedata = {
          phone: omrcandidate.phone,
          phonecode: omrcandidate.phonecode,
          isOMR: true,
          phoneverified: new Date(),
        };
        if (candidatecreatestatus) {
          if (omrcandidate.fullname) {
            candidatedata["fullname"] = omrcandidate.fullname;
          } else {
            candidatecreatestatus = false;
            creationfailmssg = "Name missing";
          }
        }
        if (candidatecreatestatus) {
          if (omrcandidate.dob) {
            candidatedata["dob"] = omrcandidate.dob;
          } else {
            candidatecreatestatus = false;
            creationfailmssg = "dob missing";
          }
        }
        if (candidatecreatestatus) {
          if (gender) {
            candidatedata["genderId"] = gender.id;
          } else {
            candidatecreatestatus = false;
            creationfailmssg = "Gender missing";
          }
        }
        if (candidatecreatestatus) {
          if (!state) {
            candidatecreatestatus = false;
            creationfailmssg = "State missing";
          }
        }
        if (candidatecreatestatus) {
          if (socialstatus) {
            candidatedata["socialstatusId"] = socialstatus.id;
          } else {
            candidatecreatestatus = false;
            creationfailmssg = "Category missing";
          }
        }
        const photoBuffer = Buffer.from(omrcandidate.photo);
        const signBuffer = Buffer.from(omrcandidate.sign);
        const photoresult = await uploadToCloudinary(photoBuffer);
        const signresult = await uploadToCloudinary(signBuffer);
        if (candidatecreatestatus) {
          if (photoresult) {
            candidatedata["photoid"] = photoresult["public_id"];
          } else {
            candidatecreatestatus = false;
            creationfailmssg = "Photo creation failed";
          }
        }
        if (candidatecreatestatus) {
          if (signresult) {
            candidatedata["signid"] = signresult["public_id"];
          } else {
            candidatecreatestatus = false;
            creationfailmssg = "Sign creation failed";
          }
        }
        if (candidatecreatestatus) {
          try {
            const newcandidate = await prisma.candidate.create({
              data: candidatedata,
            });
            candidate = newcandidate;
            await prisma.oMRMigrate.update({
              where: {
                id: omrcandidate.id,
              },
              data: {
                candidateId: candidate.id,
              },
            });
          } catch (error) {
            await updateOMRComment(
              omrcandidate.id,
              "Candidate Creation Failed"
            );
          }
        } else {
          await updateOMRComment(omrcandidate.id, creationfailmssg);
        }
      }
    } else {
      await updateOMRComment(omrcandidate.id, "Phone or exam city missing");
    }
  }
  return candidate;
};

const createOnboarding = async (candidate) => {
  let onboarding = await prisma.onboarding.findUnique({
    where: {
      candidateId: candidate.id,
    },
  });

  if (onboarding) {
    return true;
  } else {
    try {
      // create onboarding
      const onboardingData = {
        candidateId: candidate.id,
      };
      await prisma.onboarding.create({
        data: onboardingData,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
};

const createPlusTwoInfo = async (candidate, omrcandidate) => {
  let plustwoinfo = await prisma.plusTwoInfo.findUnique({
    where: {
      candidateId: candidate.id,
    },
  });

  if (plustwoinfo) {
    return true;
  } else {
    try {
      // create plustwoinfo
      const state = await prisma.state.findFirst({
        where: {
          code: omrcandidate.state,
        },
      });
      await prisma.plusTwoInfo.create({
        data: {
          candidateId: candidate.id,
          stateId: state.id,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
};

const createCanApplication = async (candidate, omrcandidate) => {
  let application = null;

  if (omrcandidate.examapplicationId) {
    application = await prisma.examApplication.findUnique({
      where: {
        id: omrcandidate.examapplicationId,
      },
    });
  } else {
    const exam = await getActiveExamByCode("AEEE");
    if (exam) {
      const candidateapplication = await prisma.examApplication.findUnique({
        where: {
          examId_candidateId: {
            examId: exam.id,
            candidateId: candidate.id,
          },
        },
      });
      if (candidateapplication) {
        application = candidateapplication;
      } else {
        try {
          const randomNumber = Math.floor(Date.now());
          let reference = `${exam.entrance.code}-${randomNumber}`;
          let type = ExamApplicationType.OMR;
          const applndata = {
            examId: exam.id,
            candidateId: candidate.id,
            reference,
            type,
          };
          let newapplication = await prisma.examApplication.create({
            data: applndata,
          });
          application = newapplication;
        } catch (error) {
          await updateOMRComment(
            omrcandidate.id,
            "Application creation failed"
          );
        }
      }
    } else {
      await updateOMRComment(omrcandidate.id, "No Exam found");
    }
  }
  return application;
};

const createApplicationJEE = async (application) => {
  let applicationjee = await prisma.applicationJEE.findUnique({
    where: {
      examapplicationId: application.id,
    },
  });
  if (applicationjee) {
    return true;
  } else {
    // create applicationjee
    try {
      await prisma.applicationJEE.create({
        data: {
          examapplicationId: application.id,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
};

const createApplicationCities = async (application, omrcandidate) => {
  let applicationcities = await prisma.applicationCities.findMany({
    where: {
      examapplicationId: application.id,
    },
  });
  if (applicationcities.length > 0) {
    return true;
  } else {
    const exam = await getActiveExamByCode("AEEE");
    // create application cities
    try {
      const examcities = [
        omrcandidate.examcity1,
        omrcandidate.examcity2,
        omrcandidate.examcity3,
      ];
      for (const city of examcities) {
        if (city) {
          const excity = await prisma.examCity.findFirst({
            where: {
              entranceId: exam.entrance.id,
              city: {
                code: city,
              },
            },
          });
          if (excity) {
            await prisma.applicationCities.create({
              data: {
                examapplicationId: application.id,
                examcityId: excity.id,
              },
            });
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }
};

async function getActiveExamByCode(code) {
  return await prisma.exam.findFirst({
    where: {
      entrance: {
        code,
      },
    },
    include: {
      entrance: true,
    },
  });
}

async function createApplication(candidate, exam, examcities) {
  const randomNumber = Math.floor(Date.now());
  let reference = `${exam.entrance.code}-${randomNumber}`;
  let type = ExamApplicationType.OMR;
  const applndata = {
    examId: exam.id,
    candidateId: candidate.id,
    reference,
    type,
    status: ExamApplicationStatus.APPLIED,
  };
  let application = await prisma.examApplication.create({
    data: applndata,
  });
  if (application) {
    await prisma.applicationJEE.create({
      data: {
        examapplicationId: application.id,
      },
    });
    for (const city of examcities) {
      const excity = await prisma.examCity.findFirst({
        where: {
          entranceId: exam.entrance.id,
          city: {
            code: city,
          },
        },
      });
      if (excity) {
        await prisma.applicationCities.create({
          data: {
            examapplicationId: application.id,
            examcityId: excity.id,
          },
        });
      }
    }
  }
  return application;
}

async function updateOMRComment(id, comment) {
  await prisma.oMRMigrate.update({
    where: {
      id,
    },
    data: {
      comment,
    },
  });
}

async function uploadToCloudinary(buffer) {
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream((error, result) => {
          if (error) {
            console.error("Upload Error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(buffer);
    });

    return uploadResult; // Return the result on successful upload
  } catch (error) {
    return null; // Return an empty string if an error occurs
  }
}

export const completeOMRRegistration = async (req, res) => {
  const { candidateid } = req.body;
  // get application details using application id
  const omr = await prisma.oMRMigrate.findFirst({
    where: {
      candidateId: candidateid,
    },
    include: {
      examapplication: true,
    },
  });
  const registration = await prisma.registration.create({
    data: {
      examId: omr.examapplication.examId,
      examapplicationId: omr.examapplicationId,
      registrationNo: omr.registrationNo,
      type: "OMR",
      createdAt: omr.regDate ? omr.regDate : null,
    },
  });
  if (registration) {
    await prisma.oMRMigrate.deleteMany({
      where: {
        AND: [
          { candidateId: omr.candidateId },
          { examapplicationId: omr.examapplicationId },
        ],
      },
    });
  }
  return res.json({ message: "success" });
};
