import prisma from "../../db";
import { BadRequestError } from "../../errors/bad-request-error";
import { InternalServerError } from "../../errors/internal-server-error";
import crypto from "crypto";
import { entranceWelcome } from "../email";
import { entranceWelcomeAgent } from "../email/entrancewelcome";
import { invokepaymentAPI } from "../leadsquared/paymentapirequest";

export const createExam = async (req, res) => {
  const data = req.body;

  const exam = await prisma.exam.create({
    data,
  });

  console.log(exam);

  return res.json(exam);
};

export const getOpenExams = async (req, res) => {
  const latestExamsByEntrance = await prisma.entrance.findMany({
    include: {
      Exam: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  const filteredEntrances = latestExamsByEntrance.filter((entrance) => {
    const allowedStatus = ["PAUSE", "CLOSED"];
    return !allowedStatus.includes(entrance.Exam[0].status);
  });

  return res.json(filteredEntrances);
};

export const checkExamValid = async (req, res) => {
  const id = req.params.id;
  const input = req.body;
  console.log(input);
  const lastExamWithEntranceCode = await prisma.exam.findFirst({
    where: {
      entrance: {
        code: input.code,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (
    !lastExamWithEntranceCode ||
    lastExamWithEntranceCode.id != id ||
    !isOpenForApplication(lastExamWithEntranceCode)
  ) {
    return res.json({ valid: false });
  }

  return res.json({ valid: true });
};

function isOpenForApplication(exam) {
  return exam.status != "PAUSE" || "CLOSED";
}

export const getAllExams = async (req, res) => {
  const allexams = await prisma.exam.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return res.json(allexams);
};

export const getExamsByEntrance = async (req, res) => {
  const { entranceId } = req.params;
  const allexams = await prisma.exam.findMany({
    where: {
      entranceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return res.json(allexams);
};

export const getExamByEntrance = async (req, res) => {
  const { id } = req.params;
  const firstExam = await prisma.exam.findFirst({
    where: {
      entranceId: id, // Replace with the actual entranceId you're interested in
      status: {
        not: "CLOSED",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(firstExam);
};

export const updateExam = async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  const updatedExam = await prisma.exam.update({
    where: {
      id,
    },
    data,
  });

  return res.json(updatedExam);
};

export const registerForExam = async (req, res) => {
  const { examId, examapplicationId } = req.body;

  const successPayment = await prisma.entrancePayments.findMany({
    where: {
      examapplicationId, // Replace with the actual application ID you want to filter by
      status: "SUCCESS",
    },
  });

  if (successPayment.length === 0) {
    throw new BadRequestError("Payment Pending");
  }

  const lastEntry = await prisma.registration.findFirst({
    where: { examId },
    orderBy: { id: "desc" },
  });

  let registrationNo = 1000001;

  if (lastEntry) {
    const lastRegNo = lastEntry.registrationNo;
    registrationNo = lastRegNo + 1;
  }

  try {
    console.log("registration details", {
      examId,
      examapplicationId,
      registrationNo,
    });

    const registration = await prisma.registration.create({
      data: {
        examId,
        examapplicationId,
        registrationNo,
      },
    });
    return res.json(registration);
  } catch (error) {
    console.log(error);
    throw new InternalServerError("Registration Failed. Please try again");
  }
};

export const examPaymentSuccess = async (req, res) => {
  console.log("payment success");
  console.log(req.body);
  const { txnid } = req.body;

  // production details
  //   const key = "ypfBaj";
  //   const salt = "aG3tGzBZ";
  //   const chkUrl = "https://info.payu.in/merchant/postservice?form=2";

  // enviornment details
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  const chkUrl = process.env.PAYU_CHKURL;

  //development details
  //   const key = "aJ1WVm";
  //   const salt = "hKmYSMBAzg5QOw64IV9MFtcu6BKaIyYA";
  //   const chkUrl = "https://test.payu.in/merchant/postservice?form=2";

  const command = "verify_payment";

  const transactionDetails = await prisma.entrancePayments.findUnique({
    where: {
      txnid,
    },
    include: {
      examapplication: {
        include: {
          exam: {
            include: {
              entrance: true,
            },
          },
        },
      },
    },
  });

  const chkHeaders = {
    accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const hashString = `${key}|${command}|${txnid}|${salt}`;

  const hash = sha512(hashString);

  const formData = new URLSearchParams();
  formData.append("key", key);
  formData.append("command", "verify_payment");
  formData.append("var1", txnid);
  formData.append("hash", hash);

  console.log(formData);

  const chkResponse = await fetch(chkUrl, {
    method: "POST",
    headers: chkHeaders,
    body: formData,
  });
  const chkResponseData = await chkResponse.json();
  if ((chkResponseData as { status: number }).status === 0) {
    return res.redirect("/applications/payment/failure");
  }

  // get all details and ssave to db

  let txnstatus =
    (chkResponseData as any).transaction_details[txnid].status === "success"
      ? "SUCCESS"
      : (chkResponseData as any).transaction_details[txnid].status === "failure"
      ? "FAILED"
      : transactionDetails.status;

  const updatedTransaction = await prisma.entrancePayments.update({
    where: {
      txnid,
    },
    data: {
      status: txnstatus,
    },
  });

  if (updatedTransaction.status === "SUCCESS") {
    const lastEntry = await prisma.registration.findFirst({
      where: {
        examId: transactionDetails.examapplication.exam.id,
        type: "ONLINE",
      },
      orderBy: { id: "desc" },
    });

    let registrationNo = 1000001;

    if (lastEntry) {
      const lastRegNo = lastEntry.registrationNo;
      registrationNo = lastRegNo + 1;
    }


    const candidate = await prisma.candidate.findUnique({
      where: {
        id: updatedTransaction.candidateId,
      },
    });

    const candid = candidate.id;
    const uname = candidate.fullname;
 let uphone = candidate.phone;
 let email = candidate.email;
 let source = "";
 const section = "App Fee Payment";
 const paystatus = "Paid";
 invokepaymentAPI({email: email,name: uname, phone: uphone, section: section, paystatus: paystatus,source: source,candid: candid},res);



    entranceWelcome(updatedTransaction.candidateId);

    try {
      const registration = await prisma.registration.create({
        data: {
          examId: transactionDetails.examapplication.exam.id,
          examapplicationId: transactionDetails.examapplication.id,
          registrationNo,
        },
      });


     
     
      return res.redirect("/applications/payment/success");
    } catch (error) {
      console.log(error);
      return res.redirect("/applications/payment/success");
    }
  }
  return res.redirect("/applications/payment/failure");
};

export const examPaymentFailure = async (req, res) => {
  console.log("payment Failure");
  console.log(req.body);
  const { txnid } = req.body;

  const updatedTransaction = await prisma.entrancePayments.update({
    where: {
      txnid,
    },
    data: {
      status: "FAILED",
    },
  });
  return res.redirect("/applications/payment/failure");
};

export const examAgentPaymentSuccess = async (req, res) => {
  console.log("payment success");
  console.log(req.body);
  const { txnid, udf1: applnno } = req.body;

  // production details
  //   const key = "ypfBaj";
  //   const salt = "aG3tGzBZ";
  //   const chkUrl = "https://info.payu.in/merchant/postservice?form=2";

  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  const chkUrl = process.env.PAYU_CHKURL;

  //development details
  //   const key = "aJ1WVm";
  //   const salt = "hKmYSMBAzg5QOw64IV9MFtcu6BKaIyYA";
  //   const chkUrl = "https://test.payu.in/merchant/postservice?form=2";

  const command = "verify_payment";

  const transactionDetails = await prisma.entrancePayments.findUnique({
    where: {
      txnid,
    },
    include: {
      examapplication: {
        include: {
          exam: {
            include: {
              entrance: true,
            },
          },
        },
      },
    },
  });

  const chkHeaders = {
    accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const hashString = `${key}|${command}|${txnid}|${salt}`;

  const hash = sha512(hashString);

  const formData = new URLSearchParams();
  formData.append("key", key);
  formData.append("command", "verify_payment");
  formData.append("var1", txnid);
  formData.append("hash", hash);

  console.log(formData);

  const chkResponse = await fetch(chkUrl, {
    method: "POST",
    headers: chkHeaders,
    body: formData,
  });
  const chkResponseData = await chkResponse.json();
  if ((chkResponseData as { status: number }).status === 0) {
    return res.redirect(`/agent/candidate/payment/${applnno}/failure`);
  }

  // get all details and ssave to db

  let txnstatus =
    (chkResponseData as any).transaction_details[txnid].status === "success"
      ? "SUCCESS"
      : (chkResponseData as any).transaction_details[txnid].status === "failure"
      ? "FAILED"
      : transactionDetails.status;

  const updatedTransaction = await prisma.entrancePayments.update({
    where: {
      txnid,
    },
    data: {
      status: txnstatus,
    },
  });

  if (updatedTransaction.status === "SUCCESS") {
    const lastEntry = await prisma.registration.findFirst({
      where: {
        examId: transactionDetails.examapplication.exam.id,
        type: "AGENT",
      },
      orderBy: { id: "desc" },
    });
    let registrationNo = 5000001;

    if (lastEntry) {
      const lastRegNo = lastEntry.registrationNo;
      registrationNo = lastRegNo + 1;
    }

    entranceWelcomeAgent(updatedTransaction.candidateId, registrationNo);
    try {
      const registration = await prisma.registration.create({
        data: {
          examId: transactionDetails.examapplication.exam.id,
          examapplicationId: transactionDetails.examapplication.id,
          registrationNo,
          type: "AGENT",
        },
      });
      return res.redirect(`/agent/candidate/payment/${applnno}/success`);
    } catch (error) {
      console.log(error);
      return res.redirect(`/agent/candidate/payment/${applnno}/success`);
    }
  }

  return res.redirect(`/agent/candidate/payment/${applnno}/failure`);
};

export const examAgentPaymentFailure = async (req, res) => {
  console.log("payment Failure");
  console.log(req.body);
  const { txnid, udf1: applnno } = req.body;

  console.log("failure txn", req.body);

  const updatedTransaction = await prisma.entrancePayments.update({
    where: {
      txnid,
    },
    data: {
      status: "FAILED",
    },
  });
  return res.redirect(`/agent/candidate/payment/${applnno}/failure`);
};

export const verifyTransaction = async (req, res) => {
  console.log("verifyTransaction");
  const { txnid } = req.body;

  // production details
  const key = "ypfBaj";
  const salt = "aG3tGzBZ";
  const chkUrl = "https://info.payu.in/merchant/postservice?form=2";

  //development details
  //   const key = "aJ1WVm";
  //   const salt = "hKmYSMBAzg5QOw64IV9MFtcu6BKaIyYA";
  //   const chkUrl = "https://test.payu.in/merchant/postservice?form=2";

  const command = "verify_payment";

  const transactionDetails = await prisma.entrancePayments.findUnique({
    where: {
      txnid,
    },
    include: {
      examapplication: {
        include: {
          exam: {
            include: {
              entrance: true,
            },
          },
        },
      },
    },
  });

  const chkHeaders = {
    accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const hashString = `${key}|${command}|${txnid}|${salt}`;

  const hash = sha512(hashString);

  const formData = new URLSearchParams();
  formData.append("key", key);
  formData.append("command", "verify_payment");
  formData.append("var1", txnid);
  formData.append("hash", hash);

  console.log(formData);

  const chkResponse = await fetch(chkUrl, {
    method: "POST",
    headers: chkHeaders,
    body: formData,
  });
  const chkResponseData = await chkResponse.json();
  if (!transactionDetails) {
    throw new BadRequestError("Transaction not found");
  }

  // get all details and ssave to db

  let txnstatus =
    (chkResponseData as any).transaction_details[txnid].status === "success"
      ? "SUCCESS"
      : (chkResponseData as any).transaction_details[txnid].status === "failure"
      ? "FAILED"
      : transactionDetails.status;

  //   const updatedTransaction = await prisma.entrancePayments.update({
  //     where: {
  //       txnid,
  //     },
  //     data: {
  //       status: txnstatus,
  //     },
  //   });

  return res.json({ chkResponseData });
};

function sha512(str) {
  return crypto.createHash("sha512").update(str).digest("hex");
}
