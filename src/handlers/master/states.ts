import prisma from "../../db";
import { InternalServerError } from "../../errors/internal-server-error";

export const getStates = async (req, res) => {
  const data = await prisma.state.findMany({
    orderBy: {
      name: "asc", // 'asc' for ascending order, 'desc' for descending
    },
  });
  res.json(data);
};

export const addState = async (req, res) => {
  try {
    const { name } = req.body;
    const item = await prisma.state.create({
      data: {
        name,
      },
    });
    return res.json(item);
  } catch (error) {
    throw new InternalServerError("Error adding State");
  }
};

export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const item = await prisma.state.update({
      where: { id: parseInt(id) },
      data,
    });
    return res.json(item);
  } catch (error) {
    throw new InternalServerError("Error updating State");
  }
};

export const removeState = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.state.delete({
      where: { id: parseInt(id) },
    });
    return res.json(item);
  } catch (error) {
    throw new InternalServerError("Error deleting State");
  }
};
