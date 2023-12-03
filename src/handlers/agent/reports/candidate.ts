import { Prisma } from "@prisma/client";
import prisma from "../../../db";
import { BadRequestError } from "../../../errors/bad-request-error";
import XLSX from "xlsx";

export const getCandidatesByAgent = async (req, res) => {
  const { id } = req.params;

  const search = req.body;

  console.log("search", search);

  const agent = await prisma.agent.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!agent) {
    throw new BadRequestError("Agent not found");
  }

  let candidatesByAgentId;

  if (search && search.searchBy) {
    const { searchBy, searchTerm } = search;

    switch (searchBy) {
      case "phone":
        candidatesByAgentId = await prisma.candidate.findMany({
          where: {
            agentId: parseInt(id),
            phone: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          include: {
            Onboarding: true,
            ExamApplication: {
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
        break;

      case "email":
        candidatesByAgentId = await prisma.candidate.findMany({
          where: {
            agentId: parseInt(id),
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          include: {
            Onboarding: true,
            ExamApplication: {
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
        break;

      case "name":
        candidatesByAgentId = await prisma.candidate.findMany({
          where: {
            agentId: parseInt(id),
            fullname: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          include: {
            Onboarding: true,
            ExamApplication: {
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
        break;

      default:
        throw new BadRequestError("Invalid searchBy value");
    }
  } else {
    // If no searchBy provided, fetch all candidates for the agent
    candidatesByAgentId = await prisma.candidate.findMany({
      where: {
        agentId: parseInt(id),
      },
      include: {
        Onboarding: true,
        ExamApplication: {
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
  }

  return res.json(candidatesByAgentId);
};

export const getApplicationsByAgent = async (req, res) => {
  const { id } = req.params;

  const search = req.body;

  console.log("search", search);

  const agent = await prisma.agent.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!agent) {
    throw new BadRequestError("Agent not found");
  }

  let applicationsByAgentId;

  if (search && search.searchBy) {
    const { searchBy, searchTerm } = search;
    applicationsByAgentId = await prisma.examApplication.findMany({
      where: {
        type: "AGENT",
        candidate: {
          agentId: 18,
        },
        exam: {
          entrance: {
            code: searchBy.toUpperCase(),
          },
        },
        reference: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      include: {
        candidate: true,
        Registration: true,
        exam: {
          include: {
            entrance: true,
          },
        },
      },
    });
  } else {
    applicationsByAgentId = await prisma.examApplication.findMany({
      where: {
        type: "AGENT",
        candidate: {
          agentId: agent.id,
        },
      },
      include: {
        candidate: true,
        Registration: true,
        exam: {
          include: {
            entrance: true,
          },
        },
      },
    });
  }
  console.log(applicationsByAgentId);

  return res.json(applicationsByAgentId);
};

export const getStatsByAgent = async (req, res) => {
  const { id } = req.params;
  const candidates = await prisma.candidate.aggregate({
    _count: true,
    where: {
      agentId: parseInt(id),
    },
  });

  const applied = await prisma.examApplication.aggregate({
    _count: true,
    where: {
      type: "AGENT",
      candidate: {
        agentId: parseInt(id),
      },
    },
  });

  const registered = await prisma.examApplication.aggregate({
    _count: true,
    where: {
      type: "AGENT",
      candidate: {
        agentId: parseInt(id),
      },
      Registration: {
        some: {
          id: {
            gt: 0,
          },
        },
      },
    },
  });

  let stats = {
    candidates: candidates._count,
    applications: { applied: applied._count, registered: registered._count },
  };
  return res.json(stats);
};
