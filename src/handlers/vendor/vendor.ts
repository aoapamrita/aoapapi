import prisma from "../../db";
import { BadRequestError } from "../../errors/bad-request-error";
import { InternalServerError } from "../../errors/internal-server-error";
import { NotAuthorizedError } from "../../errors/not-authorized-error";
import { createJWT } from "../../modules/auth";
import {
  createHash,
  generatePass,
  verifyPassword,
} from "../../utilities/passwordutils";
import {
  sendPasswordMailVendor,
  sendWelcomeMailVendor,
} from "../email/welcomevendor";

export const listVendors = async (req, res) => {
  const items = await prisma.vendor.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  return res.json(items);
};

export const createVendor = async (req, res) => {
  const { password, email } = req.body;

  if (!password || !email) {
    throw new BadRequestError("User cannot be created");
  }

  const userExists = await prisma.vendor.findUnique({
    where: {
      email,
    },
  });

  console.log(userExists);

  if (!userExists) {
    // create user with hash password
    const hash = await createHash(password);
    const data = {
      email,
      password: hash,
    };
    const user = await prisma.vendor.create({
      data,
    });
    sendWelcomeMailVendor({ email, password });
    return res.json({ message: `User created ${user.email}` });
  } else {
    throw new BadRequestError("Cannot create user.");
  }
};

export const removeVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.vendor.delete({
      where: { id: parseInt(id) },
    });
    const data = { ...deleted, password: "" };
    return res.json(data);
  } catch (error) {
    throw new InternalServerError("Error deleting agent");
  }
};

export const forgotVendorPassword = async (req, res) => {
  const { email } = req.body;

  // get agent details using username
  const vendor = await prisma.vendor.findUnique({
    where: {
      email,
    },
  });

  // if not agent return success
  if (!vendor) {
    return res.json({ message: "done" });
  }
  // if success create new random password
  const newPass = generatePass();
  const hash = await createHash(newPass);

  await prisma.vendor.update({
    where: {
      id: vendor.id,
    },
    data: {
      password: hash,
    },
  });

  // send mail
  sendPasswordMailVendor({
    email: vendor.email,
    password: newPass,
  });
  // send success

  return res.json({ message: "done" });
};

export const vendorSignin = async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);

  const user = await prisma.vendor.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    try {
      const result = await verifyPassword(password, user.password);

      if (result) {
        const userdetails = {
          email: user.email,
          role: "vendor",
        };

        const token = createJWT(userdetails);

        // Store it on session object
        req.session.jwt = token;
        // 5. return the onboarding status
        res.json({ message: "success" });
      } else {
        throw new NotAuthorizedError();
      }
    } catch (error) {
      console.log(error);
      throw new NotAuthorizedError();
    }
  } else {
    throw new NotAuthorizedError();
  }
};
