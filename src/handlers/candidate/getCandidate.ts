import { Row } from "@react-email/components";
import prisma from "../../db";
import XLSX from "xlsx";
import { application } from "express";

export const getCandidate = async (req, res) => {
  const { id } = req.currentUser;
  let candidate = await prisma.candidate.findFirst({
    where: {
      id,
    },
    include: {
      gender: true,
      socialstatus: true,
      infosource: true,
      state: true,
      district: true,
      city: true,
      ParentInfo: true,
      PlusTwoInfo: true,
    },
  });
  return res.json(candidate);
};

export const getCandidateById = async (req, res) => {
  const { id } = req.params;
  let candidate = await prisma.candidate.findFirst({
    where: {
      id,
    },
    include: {
      gender: true,
      socialstatus: true,
      infosource: true,
      state: true,
      district: true,
      city: true,
      Onboarding: true,
    },
  });
  return res.json(candidate);
};



// Get all candidates details : RG
export const getAllCandidatesInfo = async (req, res) => {

  
  let candidates = [];
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };

  const allCandidates = await prisma.candidate.findMany({
    include: {
      gender: true,
      socialstatus: true,
      infosource: true,
      state: true,
      district: true,
      city: true,
      Onboarding: true,
      ParentInfo: true,
      PlusTwoInfo: {
        include: {
          state: true,
        },
      },
      ExamApplication: {
        include: {
          exam: {
            include: {
              entrance: true,
            },
          },
          Registration: true,
          ApplicationJEE: true,
          ApplicationCities: {
            include: {
              examcity: {
                include: {
                  city: true,
                },
              },
            },
          },
        },
      },
      EntrancePayments: true,
      JEEApplication: true,
      JEEPayments: true,
    },
  });

  const formatted = allCandidates.map((row) => {
    let basic = {
      Name: row.fullname,
      DOB: new Date(row.dob).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      Gender: row.gender ? row.gender.name : null,
      Status: row.socialstatus ? row.socialstatus.name : null,
      Email: row.email,
      Phone: row.phone,
      info: row.infosource ? row.infosource.name : null,
      aadhaar: row.aadhaarnumber,
      State: row.state ? row.state.name : null,
      District: row.district ? row.district.name : null,
      City: row.city ? row.city.name : row.otherCity,
      Address1: row.address1,
      Address2: row.address2,
      ParentName: row.ParentInfo ? row.ParentInfo.fullname : null,
      ParentEmail: row.ParentInfo ? row.ParentInfo.email : null,
      ParentPhone: row.ParentInfo ? row.ParentInfo.phone : null,
      PlusTwoState: row.PlusTwoInfo
        ? row.PlusTwoInfo.state
          ? row.PlusTwoInfo.state.name
          : row.PlusTwoInfo.otherState
          ? row.PlusTwoInfo.otherState
          : null
        : null,
    };

    let entrance = {
      ...basic,
      AEEERegNo: null,
      AEEEApplnNo: null,
      AEEECities: null,
      AEEEJEE: null,
    };

    row.ExamApplication.forEach((appln) => {
      if (appln.exam.entrance.code === "AEEE") {
        entrance = {
          ...entrance,
          AEEERegNo: appln.Registration[0]
            ? appln.Registration[0].registrationNo
            : null,
          AEEEApplnNo: appln.reference,
          AEEEJEE: appln.ApplicationJEE.jee,
          AEEECities: appln.ApplicationCities.reduce((acc, city) => {
            if (acc !== "") {
              acc += ", ";
            }
            return acc + city.examcity.city.name;
          }, ""),
        };
      }
    });

    let jee = {
      ...entrance,
      JEEApplnNo: null,
      JEEStatus: null,
    };

    if (row.JEEApplication[0]) {
      jee = {
        ...jee,
        JEEApplnNo: row.JEEApplication[0].reference,
        JEEStatus: row.JEEApplication[0].status,
      };
    }

    let entrancePayments = {
      ...jee,
      AEEPayments: row.EntrancePayments.reduce((acc, txn) => {
        if (acc !== "") {
          acc += ", \n";
        }
        return (
          acc +
          `A. Desc : ${txn.description} B. Amount : ${txn.amount} C. TxnId: ${txn.txnid} D. Ref: ${txn.reference} E. Status: ${txn.status}`
        );
      }, ""),
    };

    let jeePayments = {
      ...entrancePayments,
      JEEPayments: row.JEEPayments.reduce((acc, txn) => {
        if (acc !== "") {
          acc += ", ";
        }
        return (
          acc +
          `A. Desc : ${txn.description} B. Amount : ${txn.amount} C. TxnId: ${txn.txnid} D. Ref: ${txn.reference} E. Status: ${txn.status} \n`
        );
      }, ""),
    };

    let totalData = { ...jeePayments };

    return totalData;
  });

  //   return res.json(formatted);

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Add a worksheet to the workbook
  const worksheet = XLSX.utils.json_to_sheet(formatted);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Set the appropriate headers for the response
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=excel.xlsx");

  // Send the workbook directly to the response
  res.end(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));
};


// Get all candidates details w.r.t status : AR
export const getAllCandidatesInfoByStatus = async  (req, res) => {
  

  // Get status value
 const  {status}  = req.params;

 // Convert status value to boolean
 const isStatusTrue = status === 'true';

 
  let candidates = [];

  const allCandidates = await prisma.candidate.findMany({
    where: {
      Onboarding: {
        status: isStatusTrue,
      },
    },

    include: {
      state: true,
      Onboarding: true,
      ParentInfo: true,    
    },
  });

  const formatted = allCandidates.map((row) => {
    let basic = {
      Name: row.fullname,
     /* Gender: row.gender ? row.gender.name : null,*/
      Email: row.email,
      Phone: row.phone,
      State: row.state ? row.state.name : null,
      ParentName: row.ParentInfo ? row.ParentInfo.fullname : null,
      ParentEmail: row.ParentInfo ? row.ParentInfo.email : null,
      ParentPhone: row.ParentInfo ? row.ParentInfo.phone : null,
     
    };

    return basic;
  });

  //   return res.json(formatted);

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Add a worksheet to the workbook
  const worksheet = XLSX.utils.json_to_sheet(formatted);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Set the appropriate headers for the response
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=excel.xlsx");

  // Send the workbook directly to the response
  res.end(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));
};



// Get applied candidates details : AR
export const getAllAppliedCandidatesInfo = async (req, res) => {
  
  console.log('In getAllCandidatesInfo');
 
  let candidates = [];

  const allCandidates = await prisma.candidate.findMany({
    where: {
      ExamApplication: {
        some: {
          status: 'APPLIED',
        },
      },
    },

    include: {
      state: true,
      Onboarding: true,
      ParentInfo: true, 
      ExamApplication: true,

    },
  });

  const formatted = allCandidates.map((row) => {
    let basic = {
      Name: row.fullname,
     /* Gender: row.gender ? row.gender.name : null,*/
      Email: row.email,
      Phone: row.phone,
      State: row.state ? row.state.name : null,
      ParentName: row.ParentInfo ? row.ParentInfo.fullname : null,
      ParentEmail: row.ParentInfo ? row.ParentInfo.email : null,
      ParentPhone: row.ParentInfo ? row.ParentInfo.phone : null,
     
    };

    return basic;
  });

  //   return res.json(formatted);

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Add a worksheet to the workbook
  const worksheet = XLSX.utils.json_to_sheet(formatted);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Set the appropriate headers for the response
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=excel.xlsx");

  // Send the workbook directly to the response
  res.end(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));
};
