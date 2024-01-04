import AdmZip from "adm-zip";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import prisma from "../../db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryResult {
  public_id: string;
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

  const candidates = await prisma.oMRMigrate.findMany();

  // iterate all candidates
  for (const candidate of candidates) {
    if (candidate.phone && candidate.examcity1) {
      const candidateExists = await prisma.candidate.findUnique({
        where: {
          phone: candidate.phone,
        },
      });
      if (!candidateExists) {
        // get gender from text
        const gender = await prisma.gender.findFirst({
          where: {
            name: {
              equals: candidate.gender,
              mode: "insensitive",
            },
          },
        });

        // get state from state code
        const state = await prisma.state.findFirst({
          where: {
            code: candidate.state,
          },
        });

        const socialstatus = await prisma.socialStatus.findFirst({
          where: {
            name: {
              equals: candidate.category,
              mode: "insensitive",
            },
          },
        });

        let candidatecreatestatus = true;

        let candidatedata = {
          phone: candidate.phone,
          phonecode: candidate.phonecode,
          isOMR: true,
          phoneverified: new Date(),
        };

        if (candidatecreatestatus && candidate.fullname) {
          candidatedata["fullname"] = candidate.fullname;
        } else {
          candidatecreatestatus = false;
        }
        if (candidatecreatestatus && candidate.dob) {
          candidatedata["dob"] = candidate.dob;
        } else {
          candidatecreatestatus = false;
        }
        if (candidatecreatestatus && gender) {
          candidatedata["genderId"] = gender.id;
        } else {
          candidatecreatestatus = false;
        }
        if (candidatecreatestatus && state) {
        } else {
          candidatecreatestatus = false;
        }
        if (candidatecreatestatus && socialstatus) {
          candidatedata["socialstatusId"] = socialstatus.id;
        } else {
          candidatecreatestatus = false;
        }

        const photoBuffer = Buffer.from(candidate.photo);
        const signBuffer = Buffer.from(candidate.sign);

        const photoresult = await uploadToCloudinary(photoBuffer);
        const signresult = await uploadToCloudinary(signBuffer);

        if (candidatecreatestatus && photoresult) {
          candidatedata["photoid"] = photoresult["public_id"];
        } else {
          candidatecreatestatus = false;
        }
        if (candidatecreatestatus && signresult) {
          candidatedata["signid"] = signresult["public_id"];
        } else {
          candidatecreatestatus = false;
        }

        console.log("candidate data", candidatedata);
        console.log("candidate create status", candidatecreatestatus);

        if (candidatecreatestatus) {
          try {
            const newcandidate = await prisma.candidate.create({
              data: candidatedata,
            });
            const onboardingData = {
              candidateId: newcandidate.id,
            };
            await prisma.onboarding.create({
              data: onboardingData,
            });

            await prisma.plusTwoInfo.create({
              data: {
                candidateId: newcandidate.id,
                stateId: state.id,
              },
            });
            console.log("candidate", newcandidate);
          } catch (error) {
            await updateOMRComment(candidate.id, "Candidate Creation Failed");
          }
        } else {
          await updateOMRComment(candidate.id, "Not enough information");
        }
      } else {
        await updateOMRComment(candidate.id, "Phone already exists");
      }
    } else {
      await updateOMRComment(candidate.id, "Not enough information");
    }
  }

  // create candidate
  // create application
  // update sync table

  return res.json("photoresult");
};

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
