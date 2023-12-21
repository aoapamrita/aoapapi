import nodemailer from "nodemailer";
import prisma from "../../db";
import { render } from "@react-email/render";
import AdmitCardWelcome from "../../emails/admitcardwelcome";

const smtptransporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "noreply@amrita.edu",
    pass: "Bot55384",
  },
});

async function sendMail(options) {
  await smtptransporter.sendMail(options, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(info);
    }
  });
}

export const sendAdmitCardMail = async (regno) => {
  try {
    const candidate = await prisma.registration.findUnique({
      where: {
        registrationNo: parseInt(regno),
      },
      select: {
        examapplication: {
          select: {
            candidate: {
              select: {
                fullname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const emailHtml = render(
      AdmitCardWelcome({ name: candidate.examapplication.candidate.fullname })
    );
    var options = {
      from: '"Directorate of Admissions - Amrita Vishwa Vidyapeetham" <noreply@amrita.edu>',
      to: candidate.examapplication.candidate.email,
      subject: "Admit Card Released - AEEE Phase 1",
      html: emailHtml,
    };
    sendMail(options);
  } catch (error) {
    console.log(error);
  }
};
