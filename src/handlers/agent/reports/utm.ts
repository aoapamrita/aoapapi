import { Prisma } from "@prisma/client";
import prisma from "../../../db";
import { BadRequestError } from "../../../errors/bad-request-error";
import XLSX from "xlsx";

export const getCandidatesByUtmSource = async (req, res) => {
  const { source } = req.params;
  const { stateId, districtId } = req.body;

  let whereClause = {
    Utm: {
      utm_source: source,
    },
  };

  if (stateId) {
    whereClause["stateId"] = stateId;
  }

  if (districtId) {
    whereClause["districtId"] = districtId;
  }

  const candidatesWithUtmSource = await prisma.candidate.findMany({
    where: whereClause,
    include: {
      Utm: {
        select: {
          utm_medium: true,
          utm_campaign: true,
        },
      },
      Onboarding: {
        select: {
          status: true,
        },
      },
      state: true,
      district: true,
    },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order
    },
  });
  return res.json(candidatesWithUtmSource);
};

export const downloadCandidatesByUtmSource = async (req, res) => {
  const { source } = req.params;
  const { stateId, districtId } = req.body;

  let whereClause = {
    Utm: {
      utm_source: source,
    },
  };

  if (stateId) {
    whereClause["stateId"] = stateId;
  }

  if (districtId) {
    whereClause["districtId"] = districtId;
  }

  const candidatesWithUtmSource = await prisma.candidate.findMany({
    where: whereClause,
    include: {
      Utm: {
        select: {
          utm_medium: true,
          utm_campaign: true,
        },
      },
      Onboarding: {
        select: {
          status: true,
        },
      },
      state: true,
      district: true,
    },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order
    },
  });

  const formatted = candidatesWithUtmSource.map((row) => ({
    Medium: row.Utm ? row.Utm.utm_medium : "nil",
    Campaign: row.Utm ? row.Utm.utm_campaign : "nil",
    Name: row.fullname ? row.fullname : "nil",
    Email: row.email ? row.email : "nil",
    Phone: row.phone ? row.phone : "nil",
    State: row.state ? row.state.name : "nil",
    District: row.district ? row.district.name : "nil",
    Profile_Updated: row.Onboarding.status ? "Completed" : "Pending",
  }));

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

export const getUtmCandidatesByEntrance = async (req, res) => {
  const { source } = req.params;
  const { stateId, districtId, entranceId } = req.body;
  console.log(entranceId);

  let queryString = null;

  if (entranceId) {
    queryString = Prisma.sql`
      SELECT
      u.utm_medium as medium,
      u.utm_campaign as campaign,
      c.id AS candidate_id,
      c.fullname,
      c.email,
      c.phone,
      CASE WHEN ea.id IS NOT NULL THEN true ELSE false END AS applied,
      CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS registered,
      s.id AS state_id,
      s.name AS state_name,
      d.id AS district_id,
      d.name AS district_name
    FROM "Candidate" c
    LEFT JOIN "Utm" u ON c.id = u."candidateId"
    LEFT JOIN "ExamApplication" ea ON c.id = ea."candidateId"
    LEFT JOIN "Exam" e ON ea."examId" = e.id AND e."entranceId" = ${entranceId}
    LEFT JOIN "Registration" r ON e.id = r."examId" AND ea.id = r."examapplicationId"
    LEFT JOIN "State" s ON c."stateId" = s.id
    LEFT JOIN "District" d ON c."districtId" = d.id
    WHERE u.utm_source = ${source}
    ${stateId ? Prisma.sql`AND c."stateId" = ${stateId}` : Prisma.sql``}
    ${
      districtId ? Prisma.sql`AND c."districtId" = ${districtId}` : Prisma.sql``
    }
    ORDER BY c."createdAt" DESC;
            `;
  }

  if (queryString) {
    try {
      const utmCounts = await prisma.$queryRaw(queryString);

      const resultArr = utmCounts as any[];

      console.log(resultArr);

      // Convert BigInt to regular numbers
      const formattedCounts = resultArr.map((row) => ({
        candidate_id: row.candidate_id,
        medium: row.medium,
        campaign: row.campaign,
        fullname: row.fullname,
        email: row.email,
        phone: row.phone,
        applied: row.applied,
        registered: row.registered,
        state_id: row.state_id,
        state_name: row.state_name,
        district_id: row.district_id,
        district_name: row.district_name,
      }));

      return res.json(formattedCounts);
    } catch (error) {
      console.log(error);
      throw new BadRequestError("Request cannot be processed");
    }
  } else {
    return res.json([]);
  }
};

export const downloadUtmCandidatesByEntrance = async (req, res) => {
  const { source } = req.params;
  const { stateId, districtId, entranceId } = req.body;
  console.log(entranceId);

  let queryString = null;

  if (entranceId) {
    queryString = Prisma.sql`
        SELECT
        u.utm_medium as medium,
        u.utm_campaign as campaign,
        c.id AS candidate_id,
        c.fullname,
        c.email,
        c.phone,
        CASE WHEN ea.id IS NOT NULL THEN true ELSE false END AS applied,
        CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS registered,
        s.id AS state_id,
        s.name AS state_name,
        d.id AS district_id,
        d.name AS district_name
      FROM "Candidate" c
      LEFT JOIN "Utm" u ON c.id = u."candidateId"
      LEFT JOIN "ExamApplication" ea ON c.id = ea."candidateId"
      LEFT JOIN "Exam" e ON ea."examId" = e.id AND e."entranceId" = ${entranceId}
      LEFT JOIN "Registration" r ON e.id = r."examId" AND ea.id = r."examapplicationId"
      LEFT JOIN "State" s ON c."stateId" = s.id
      LEFT JOIN "District" d ON c."districtId" = d.id
      WHERE u.utm_source = ${source}
      ${stateId ? Prisma.sql`AND c."stateId" = ${stateId}` : Prisma.sql``}
      ${
        districtId
          ? Prisma.sql`AND c."districtId" = ${districtId}`
          : Prisma.sql``
      }
      ORDER BY c."createdAt" DESC;
              `;
  }

  if (queryString) {
    try {
      const utmCounts = await prisma.$queryRaw(queryString);

      const resultArr = utmCounts as any[];

      // Convert BigInt to regular numbers
      const formatted = resultArr.map((row) => ({
        Medium: row.medium ? row.medium : "Nil",
        Campaign: row.campaign ? row.medium : "Nil",
        Name: row.fullname ? row.fullname : "Nil",
        Email: row.email ? row.email : "Nil",
        Phone: row.phone ? row.phone : "Nil",
        State: row.state_name ? row.state_name : "Nil",
        District: row.district_name ? row.district_name : "Nil",
        Applied: row.applied ? "Yes" : "No",
        Registered: row.registered ? "Yes" : "No",
      }));

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
    } catch (error) {
      console.log(error);
      throw new BadRequestError("Request cannot be processed");
    }
  } else {
    return res.json([]);
  }
};
