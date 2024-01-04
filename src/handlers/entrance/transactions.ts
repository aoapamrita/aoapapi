import { Prisma } from "@prisma/client";
import prisma from "../../db";
import { BadRequestError } from "../../errors/bad-request-error";
import { CannotProcessError } from "../../errors/cannot-process-error";

export const getTransactionsByApplication = async (req, res) => {
  const { role } = req.currentUser;
  const examapplicationId = req.params.id;

  if (!examapplicationId) {
    throw new BadRequestError("Input is invalid");
  }

  let whereClause: {
    examapplicationId: string;
    type?: "ONLINE" | "AGENT";
  } = {
    examapplicationId,
  };

  if (role === "candidate") {
    whereClause.type = "ONLINE";
  } else if (role === "agent") {
    whereClause.type = "AGENT";
  }

  const entrancePayments = await prisma.entrancePayments.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order (latest to oldest)
    },
    include: {
      examapplication: true, 
    },
  });

  return res.json(entrancePayments);
};

export const getTransactionsByCandidate = async (req, res) => {
  const { id } = req.currentUser;

  const entrancePayments = await prisma.entrancePayments.findMany({
    where: {
      candidateId: id,
      type: "ONLINE",
    },
    orderBy: {
      createdAt: "desc", // Sort by createdAt in descending order (latest to oldest)
    },
  });

  return res.json(entrancePayments);
};

export const createEntranceTransaction = async (req, res) => {
  const { candidateId, examapplicationId, description, amount, type } =
    req.body;
  const randomNumber = Math.floor(Date.now());

  const reference = `AEEE-${candidateId
    .slice(0, 4)
    .toUpperCase()}-${examapplicationId
    .slice(0, 4)
    .toUpperCase()}-${randomNumber}`;

  try {
    const newTransaction = await prisma.entrancePayments.create({
      data: {
        reference,
        candidateId,
        examapplicationId,
        description,
        amount,
        type: type ? type : "ONLINE",
      },
    });
    return res.json(newTransaction);
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Transaction cannot be created");
  }
};
