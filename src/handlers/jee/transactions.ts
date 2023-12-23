import { Prisma } from "@prisma/client";
import prisma from "../../db";
import { BadRequestError } from "../../errors/bad-request-error";
import { CannotProcessError } from "../../errors/cannot-process-error";
import crypto from "crypto";

export const getJeeTransactionsByApplication = async (req, res) => {
  const jeeapplicationId = req.params.id;

  if (!jeeapplicationId) {
    throw new BadRequestError("Input is invalid");
  }

  const entrancePayments = await prisma.jEEPayments.findMany({
    where: {
      jeeapplicationId,
    },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order (latest to oldest)
    },
  });

  return res.json(entrancePayments);
};

export const getJeeTransactionsByCandidate = async (req, res) => {
  const { id } = req.currentUser;

  const entrancePayments = await prisma.jEEPayments.findMany({
    where: {
      candidateId: id,
    },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order (latest to oldest)
    },
  });

  return res.json(entrancePayments);
};

export const createJeeTransaction = async (req, res) => {
  const { candidateId, jeeapplicationId, description, amount } = req.body;
  const randomNumber = Math.floor(Date.now());

  const reference = `JEE-${candidateId
    .slice(0, 4)
    .toUpperCase()}-${jeeapplicationId
    .slice(0, 4)
    .toUpperCase()}-${randomNumber}`;

  try {
    const newTransaction = await prisma.jEEPayments.create({
      data: {
        reference,
        candidateId,
        jeeapplicationId,
        description,
        amount,
      },
    });
    return res.json(newTransaction);
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Transaction cannot be created");
  }
};

export const jeePaymentSuccess = async (req, res) => {
  console.log("payment success");
  console.log("payment success details", req.body);
  const { txnid } = req.body;

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

  console.log("form data", formData);

  const chkResponse = await fetch(chkUrl, {
    method: "POST",
    headers: chkHeaders,
    body: formData,
  });
  const chkResponseData = await chkResponse.json();

  console.log("response data", chkResponseData);

  if ((chkResponseData as { status: number }).status === 0) {
    return res.redirect("/applications/payment/failure");
  }

  const transactionDetails = await prisma.jEEPayments.findUnique({
    where: {
      txnid,
    },
  });

  let txnstatus =
    (chkResponseData as any).transaction_details[txnid].status === "success"
      ? "SUCCESS"
      : (chkResponseData as any).transaction_details[txnid].status === "failure"
      ? "FAILED"
      : transactionDetails.status;

  const updatedTransaction = await prisma.jEEPayments.update({
    where: {
      txnid,
    },
    data: {
      status: txnstatus,
    },
  });

  const updatedJee = await prisma.jEEApplication.update({
    where: {
      id: transactionDetails.jeeapplicationId,
    },
    data: {
      status: "REGISTERED",
    },
  });

  return res.redirect("/jee/payment/success");
};

export const jeePaymentFailure = async (req, res) => {
  console.log("payment failed");
  console.log(req.body);
  const { txnid } = req.body;

  const updatedTransaction = await prisma.jEEPayments.update({
    where: {
      txnid,
    },
    data: {
      status: "FAILED",
    },
  });

  return res.redirect("/jee/payment/failure");
};

function sha512(str) {
  return crypto.createHash("sha512").update(str).digest("hex");
}
