import prisma from "../../db";

export const createCandidateParent = async (req, res) => {
  const { id } = req.currentUser;
  const data = req.body;
  console.log(data);

  const candidate = await prisma.parentInfo.upsert({
    where: {
      candidateId: id,
    },
    update: data,
    create: { ...data, candidateId: id },
  });
  return res.json(candidate);
};

export const updateCandidateParentById = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  console.log(data);

  const candidate = await prisma.parentInfo.update({
    where: {
      candidateId: id,
    },
    data,
  });
  return res.json(candidate);
};

export const updateCandidatePlustwoById = async (req, res) => {
  const { id } = req.params;
  const reqdata = req.body;
  const data = { ...reqdata, stateId: parseInt(reqdata.stateId) };

  if (data.stateId === 9999999999) {
    data.stateId = null;
  } else {
    data.otherState = "";
  }

  const candidate = await prisma.plusTwoInfo.update({
    where: {
      candidateId: id,
    },
    data,
  });

  return res.json(candidate);
};

export const createAgentCandidateParent = async (req, res) => {
  const data = req.body;

  const candidate = await prisma.parentInfo.upsert({
    where: {
      candidateId: data.candidateId,
    },
    update: data,
    create: data,
  });
  return res.json(candidate);
};
