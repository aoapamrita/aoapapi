import { Prisma } from "@prisma/client";
import prisma from "../../db";
import { BadRequestError } from "../../errors/bad-request-error";
import { CannotProcessError } from "../../errors/cannot-process-error";

export const createApplication = async (req, res) => {
  const body = req.body;
  const user = req.currentUser;
  const randomNumber = Math.floor(Date.now());
  const reference = `AEEE-${randomNumber}`;

  const applndata = { ...body, candidateId: user.id, reference };

  let application = await prisma.examApplication.create({
    data: applndata,
  });

  await prisma.applicationJEE.create({
    data: {
      examapplicationId: application.id,
    },
  });

  let completeApplication = await prisma.examApplication.findFirst({
    where: {
      id: application.id,
    },
    include: {
      Registration: true,

      exam: {
        include: {
          entrance: true, // Include Entrance details
        },
      },
    },
  });

  res.json(completeApplication);
};

enum ExamApplicationType {
  ONLINE = "ONLINE",
  OMR = "OMR",
  AGENT = "AGENT",
}

export const createEntranceApplication = async (req, res) => {
  const { examId, candidateId } = req.body;
  const user = req.currentUser;
  const randomNumber = Math.floor(Date.now());
  let reference;
  let type = ExamApplicationType.ONLINE;

  const exam = await prisma.exam.findUnique({
    where: {
      id: examId,
    },
    include: {
      entrance: true,
    },
  });

  if (exam) {
    reference = `${exam.entrance.code}-${randomNumber}`;
  } else {
    throw new BadRequestError("Exam does not exist");
  }

  if (user.role === "agent") {
    type = ExamApplicationType.AGENT;
  }

  const applndata = { examId, candidateId, reference, type };

  let application = await prisma.examApplication.create({
    data: applndata,
  });

  if (exam.entrance.code === "AEEE") {
    await createAEEEApplicationInfo(application);
  }

  res.json(application);
};

const createAEEEApplicationInfo = async (application) => {
  await prisma.applicationJEE.create({
    data: {
      examapplicationId: application.id,
    },
  });
};

export const updateApplication = async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  const updatedAppln = await prisma.examApplication.update({
    where: {
      id,
    },
    data,
  });

  res.json(updatedAppln);
};

export const getApplication = async (req, res) => {
  const id = req.params.id;

  let application = await prisma.examApplication.findFirst({
    where: {
      id,
    },
    include: {
      Registration: {
        include: {
          Slot: true,
          AdmitCard: true,
        },
      },

      candidate: {
        include: {
          agent: true,
        },
      },
      exam: {
        include: {
          entrance: true, // Include Entrance details
        },
      },
    },
  });
  return res.json(application);
};

export const getApplicationByExam = async (req, res) => {
  const examId = req.params.examid;
  const { id: candidateId } = req.currentUser;

  console.log(examId);
  console.log(candidateId);

  let application = await prisma.examApplication.findFirst({
    where: {
      examId,
      candidateId,
    },
    include: {
      Registration: {
        include: {
          Slot: true,
          AdmitCard: true,
        },
      },

      exam: {
        include: {
          entrance: true, // Include Entrance details
        },
      },
    },
  });
  return res.json(application);
};

export const getApplicationByExamCandidate = async (req, res) => {
  const { examId, candidateId } = req.params;

  console.log(examId);
  console.log(candidateId);

  let application = await prisma.examApplication.findFirst({
    where: {
      examId,
      candidateId,
    },
    include: {
      Registration: true,

      exam: {
        include: {
          entrance: true, // Include Entrance details
        },
      },
    },
  });

  return res.json(application);
};

export const getApplicationByCandidateId = async (req, res) => {
  const { id: candidateId } = req.currentUser;

  console.log(candidateId);

  let application = await prisma.examApplication.findFirst({
    where: {
      candidateId,
    },
    include: {
      Registration: true,

      exam: {
        include: {
          entrance: true, // Include Entrance details
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Sorting by createdAt in descending order
    },
  });
  return res.json(application);
};

export const updateApplicationProgress = async (req, res) => {
  const examapplicationId = req.params.id;
  const current = req.body.current;

  console.log(req.params);
  console.log(req.body);

  const applicationupdated = await prisma.examApplicationProgress.update({
    where: {
      examapplicationId,
    },
    data: {
      current,
    },
  });

  return res.json(applicationupdated);
};
export const updateApplicationJeeStatus = async (req, res) => {
  const examapplicationId = req.params.id;
  const { jee } = req.body;
  console.log(examapplicationId);
  console.log(jee);

  if (!examapplicationId) {
    throw new BadRequestError("Input is invalid");
  }

  const applicationupdated = await prisma.applicationJEE.upsert({
    where: {
      examapplicationId,
    },
    update: {
      jee,
    },
    create: {
      examapplicationId,
      jee,
    },
  });

  return res.json(applicationupdated);
};

export const addProgrammeToApplication = async (req, res) => {
  const examapplicationId = req.params.id;
  const { programmeId } = req.body;
  console.log(examapplicationId);
  console.log(programmeId);

  if (!examapplicationId || !programmeId) {
    throw new BadRequestError("Input is invalid");
  }
  let item = null;
  try {
    item = await prisma.applicationProgrammes.create({
      data: {
        examapplicationId,
        programmeId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new CannotProcessError("Programme already exists", "name");
      } else if (error.code === "P2003") {
        throw new CannotProcessError("Required input is missing");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }

  return res.json(item);
};

export const getProgrammeByApplication = async (req, res) => {
  const examapplicationId = req.params.id;

  if (!examapplicationId) {
    throw new BadRequestError("Input is invalid");
  }

  const programsByApplicationId = await prisma.applicationProgrammes.findMany({
    where: {
      examapplicationId, // Filter by applicationId
    },
    include: {
      programme: {
        include: {
          course: true, // Include course details
          campus: true, // Include campus details
        },
      },
    },
  });

  return res.json(programsByApplicationId);
};

export const getApplicationJeeStatus = async (req, res) => {
  const examapplicationId = req.params.id;

  if (!examapplicationId) {
    throw new BadRequestError("Input is invalid");
  }

  const applicationJeeStatus = await prisma.applicationJEE.findUnique({
    where: {
      examapplicationId,
    },
  });

  return res.json(applicationJeeStatus);
};

export const removeProgrammeFromApplication = async (req, res) => {
  const examapplicationId = req.params.id;
  const programmeId = parseInt(req.params.programmeId);
  console.log(examapplicationId);
  console.log(programmeId);

  if (!examapplicationId || !programmeId) {
    throw new BadRequestError("Input is invalid");
  }
  try {
    await prisma.applicationProgrammes.delete({
      where: {
        examapplicationId_programmeId: {
          examapplicationId,
          programmeId,
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(error);
      if (error.code === "P2025") {
        throw new CannotProcessError("Record does not exist");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }

  return res.json({ message: "success" });
};

export const addCityToApplication = async (req, res) => {
  const examapplicationId = req.params.id;
  const examcityId = parseInt(req.body.examcityId);
  console.log(examapplicationId);
  console.log(examcityId);

  if (!examapplicationId || !examcityId) {
    throw new BadRequestError("Input is invalid");
  }
  let item = null;
  try {
    item = await prisma.applicationCities.create({
      data: {
        examapplicationId,
        examcityId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new CannotProcessError("City already exists", "name");
      } else if (error.code === "P2003") {
        throw new CannotProcessError("Required input is missing");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }

  return res.json({ examapplicationId, examcityId });
};

export const getCityByApplication = async (req, res) => {
  const examapplicationId = req.params.id;

  if (!examapplicationId) {
    throw new BadRequestError("Input is invalid");
  }

  const citiesByApplicationId = await prisma.applicationCities.findMany({
    where: {
      examapplicationId,
    },
    orderBy: {
      id: "asc", // Sort by 'id' in ascending order
    },
    include: {
      examcity: {
        include: {
          city: true, // Include the City details from ExamCity
        },
      },
    },
  });

  return res.json(citiesByApplicationId);
};

export const removeCityFromApplication = async (req, res) => {
  const examapplicationId = req.params.id;
  const examcityId = parseInt(req.params.examcityId);
  console.log(examapplicationId);
  console.log(examcityId);

  if (!examapplicationId || !examcityId) {
    throw new BadRequestError("Input is invalid");
  }
  try {
    await prisma.applicationCities.delete({
      where: {
        examapplicationId_examcityId: {
          examapplicationId,
          examcityId,
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(error);
      if (error.code === "P2025") {
        throw new CannotProcessError("Record does not exist");
      } else {
        throw new BadRequestError("Cannot process the request");
      }
    } else {
      throw new BadRequestError("Cannot process the request");
    }
  }

  return res.json({ message: "success" });
};
