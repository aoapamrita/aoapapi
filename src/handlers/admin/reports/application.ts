import { Prisma } from "@prisma/client";
import prisma from "../../../db";
import { BadRequestError } from "../../../errors/bad-request-error";
import XLSX from "xlsx";

export const getApplicationReport = async (req, res) => {
  const { download } = req.query;
  const { examId } = req.body;
  let queryString = Prisma.sql`

    `;

  if (examId) {
    queryString = Prisma.sql`
      SELECT C."fullname",C."phone",C."email",R."registrationNo",R."createdAt",TO_CHAR(R."createdAt", 'DD-MM-YYYY HH12:MI:SS AM') AS createdDate  FROM "Registration" R

  INNER JOIN "ExamApplication" EA ON R."examapplicationId" =  EA."id"

  INNER JOIN "Candidate" C ON EA."candidateId" =  C."id"

  WHERE R."examId" = ${examId}
  ORDER BY R."createdAt" DESC
        `;
  }

  console.log(queryString);

  try {
    const application = await prisma.$queryRaw(queryString);

    const resultArr = application as any[];

    console.log(resultArr);

    // Convert BigInt to regular numbers
    const formattedCounts = resultArr.map((row) => ({
      AppNo: row.registrationNo,
      Name: row.fullname,
      EmailId: row.email,
      PhoneNumber: row.phone,
      RegisteredDateandTime: row.createddate,
    }));

    console.log(formattedCounts);
    if (download) {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Add a worksheet to the workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedCounts);

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
      return res.json(formattedCounts);
    }
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Request cannot be processed");
  }
};

export const getRegisteredUsersByExam = async (req, res) => {
  const { examid: examId } = req.params;

  const candidates = await prisma.registration.findMany({
    where: {
      examId,
      centersyncstatus: false,
    },
    include: {
      examapplication: {
        include: {
          candidate: true,
        },
      },
    },
    orderBy: {
      registrationNo: "asc",
    },
    take: 100, // Fetches only the top 10 records
  });

  return res.json(candidates);
};
