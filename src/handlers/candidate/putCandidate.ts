import { Prisma } from "@prisma/client";
import prisma from "../../db";
import { CannotProcessError } from "../../errors/cannot-process-error";
import { BadRequestError } from "../../errors/bad-request-error";

export const createCandidate = async (req, res) => {
  const data = { ...req.body };
  if (data.dob) {
    const dobstr = new Date(data.dob);
    data.dob = new Date(data.dob);
  }

  if (data.aadhaarverified === "") {
    delete data.aadhaarverified;
  }
  console.log(data);
  if (data.cityId === 9999999999) {
    delete data.cityId;
  } else {
    delete data.otherCity;
  }
  try {
    const candidate = await prisma.candidate.create({
      data,
    });
    return res.json(candidate);
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new CannotProcessError(
          `${error.meta.target[0]} already exists`,
          `${error.meta.target[0]}`
        );
      } else if (error.code === "P2003") {
        throw new CannotProcessError("Required input is missing");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }
};

export const putCandidate = async (req, res) => {
  const { id } = req.currentUser;
  const data = { ...req.body };
  if (data.dob) {
    const dobstr = new Date(data.dob);
    data.dob = new Date(data.dob);
  }

  if (data.aadhaarverified === "") {
    delete data.aadhaarverified;
  }
  console.log(data);
  if (data.cityId === 9999999999) {
    delete data.cityId;
  } else {
    delete data.otherCity;
  }
  try {
    const candidate = await prisma.candidate.update({
      where: {
        id,
      },
      data,
    });
    return res.json(candidate);
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new CannotProcessError(
          `${error.meta.target[0]} already exists`,
          `${error.meta.target[0]}`
        );
      } else if (error.code === "P2003") {
        throw new CannotProcessError("Required input is missing");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }
};

export const putCandidateById = async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.dob) {
    data.dob = new Date(data.dob);
  }

  if (data.aadhaarverified === "") {
    delete data.aadhaarverified;
  }
  console.log(data);
  if (data.cityId === 9999999999) {
    data.cityId = null;
  } else {
    data.otherCity = "";
  }
  try {
    const candidate = await prisma.candidate.update({
      where: {
        id,
      },
      data,
    });
    return res.json(candidate);
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new CannotProcessError(
          `${error.meta.target[0]} already exists`,
          `${error.meta.target[0]}`
        );
      } else if (error.code === "P2003") {
        throw new CannotProcessError("Required input is missing");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }
};
