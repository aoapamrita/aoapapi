import { Prisma } from "@prisma/client";
import prisma from "../../../db";
import { BadRequestError } from "../../../errors/bad-request-error";
import XLSX from "xlsx";

export const getExamCityReport = async (req, res) => {
  const { download } = req.query;
  const { examId, showBy } = req.body;

  console.log("Show By", showBy);

  let queryString;

  if (showBy === "city") {
    queryString = Prisma.sql`
    WITH RankedCities AS (
        SELECT
            c.name AS locationName,
            s.name AS stateName,
            ROW_NUMBER() OVER (PARTITION BY ea.id ORDER BY ac.id) AS rowNumber
        FROM "ExamApplication" ea
        LEFT JOIN "ApplicationCities" ac ON ea.id = ac."examapplicationId"
        LEFT JOIN "ExamCity" ec ON ac."examcityId" = ec.id
        LEFT JOIN "City" c ON ec."cityId" = c.id
        LEFT JOIN "District" d ON c."districtId" = d.id
        LEFT JOIN "State" s ON d."stateId" = s.id
        LEFT JOIN "Registration" r ON ea.id = r."examapplicationId"
        WHERE ea."examId" = ${examId} AND c.name IS NOT NULL AND r.id IS NOT NULL
    )

    SELECT
        stateName,
        locationName,
        COUNT(*) FILTER(WHERE rowNumber = 1) AS locationCount1,
        COUNT(*) FILTER(WHERE rowNumber = 2) AS locationCount2,
        COUNT(*) FILTER(WHERE rowNumber = 3) AS locationCount3
    FROM RankedCities
    GROUP BY stateName, locationName
    ORDER BY
        stateName ASC,
        locationName ASC,
        locationCount1 DESC;
      `;
  } else {
    queryString = Prisma.sql`
    WITH RankedCities AS (
        SELECT
            s.name AS locationName,
            ROW_NUMBER() OVER (PARTITION BY ea.id ORDER BY ac.id) AS rowNumber
        FROM "ExamApplication" ea
        LEFT JOIN "ApplicationCities" ac ON ea.id = ac."examapplicationId"
        LEFT JOIN "ExamCity" ec ON ac."examcityId" = ec.id
        LEFT JOIN "City" c ON ec."cityId" = c.id
        LEFT JOIN "District" d ON c."districtId" = d.id
        LEFT JOIN "State" s ON d."stateId" = s.id
        LEFT JOIN "Registration" r ON ea.id = r."examapplicationId"
        WHERE ea."examId" = ${examId} AND s.name IS NOT NULL AND r.id IS NOT NULL
    )

    SELECT
        locationName,
        COUNT(*) FILTER(WHERE rowNumber = 1) AS locationCount1,
        COUNT(*) FILTER(WHERE rowNumber = 2) AS locationCount2,
        COUNT(*) FILTER(WHERE rowNumber = 3) AS locationCount3
    FROM RankedCities
    GROUP BY locationName
    ORDER BY
        locationName ASC,
        locationCount1 DESC;
      `;
  }

  try {
    const resultRows = await prisma.$queryRaw(queryString);

    const resultArr = resultRows as any[];

    console.log("result arr", resultArr);

    // Convert BigInt to regular numbers
    const formatted = resultArr.map((row) => ({
      State: row.statename,
      Location: row.locationname,
      Count1: row.locationcount1 != null ? Number(row.locationcount1) : null,
      Count2: row.locationcount2 != null ? Number(row.locationcount2) : null,
      Count3: row.locationcount3 != null ? Number(row.locationcount3) : null,
    }));

    if (download) {
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
    } else {
      return res.json(formatted);
    }
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Request cannot be processed");
  }
};

export const getExamCityStateReport = async (req, res) => {
  const { entranceid } = req.params;
  let queryString = Prisma.sql`
        SELECT DISTINCT
        s.id AS statecode,
        s.name AS statename
        FROM
        "ExamCity" ec
        JOIN
        "City" c ON ec."cityId" = c.id
        JOIN
        "District" d ON c."districtId" = d.id
        JOIN
        "State" s ON d."stateId" = s.id
        WHERE
        ec."entranceId" = ${entranceid};
    `;
  try {
    const resultRows = await prisma.$queryRaw(queryString);

    const resultArr = resultRows as any[];

    console.log("result arr", resultArr);
    // Convert BigInt to regular numbers
    const formatted = resultArr.map((row) => ({
      CountryCode: "IND",
      StateCode: row.statecode,
      StateName: row.statename,
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
};

export const getExamCityCityReport = async (req, res) => {
  const { entranceid } = req.params;
  let queryString = Prisma.sql`
          SELECT DISTINCT
          c.id AS citycode,
          c.name AS cityname,
          s.id AS statecode
          FROM
          "ExamCity" ec
          JOIN
          "City" c ON ec."cityId" = c.id
          JOIN
          "District" d ON c."districtId" = d.id
          JOIN
          "State" s ON d."stateId" = s.id
          WHERE
          ec."entranceId" = ${entranceid};
      `;
  try {
    const resultRows = await prisma.$queryRaw(queryString);

    const resultArr = resultRows as any[];

    console.log("result arr", resultArr);
    // Convert BigInt to regular numbers

    const formatted = resultArr.map((row) => ({
      CountryCode: "IND",
      StateCode: row.statecode,
      CityCode: row.citycode,
      CityName: row.cityname,
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
};
