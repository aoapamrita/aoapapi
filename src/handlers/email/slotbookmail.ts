import nodemailer from "nodemailer";
import prisma from "../../db";
import { render } from "@react-email/render";
import SlotBookingWelcome from "../../emails/slotwelcome";
import SlotBlukInform from "../../emails/slotbulkinform";

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
  return new Promise((resolve, reject) => {
    smtptransporter.sendMail(options, (error, info) => {
      if (error) {
        console.log(error);
        reject(error); // Rejects the promise if there's an error
      } else {
        // console.log(info);
        resolve(info); // Resolves the promise if sending is successful
      }
    });
  });
}

export const sendSlotBookMail = async (regno) => {
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
      SlotBookingWelcome({ name: candidate.examapplication.candidate.fullname })
    );
    var options = {
      from: '"Directorate of Admissions - Amrita Vishwa Vidyapeetham" <noreply@amrita.edu>',
      to: candidate.examapplication.candidate.email,
      subject: "Confirmation of Slot Booking for AEEE 2024 Phase – I ",
      html: emailHtml,
    };
    sendMail(options);
  } catch (error) {
    console.log(error);
  }
};

export const sendSlotBookBulkMail = async (candidate) => {
  try {
    const emailHtml = render(SlotBlukInform({ name: candidate.fullname }));
    var options = {
      from: '"Directorate of Admissions - Amrita Vishwa Vidyapeetham" <noreply@amrita.edu>',
      to: candidate.email,
      subject: "Slot Booking for AEEE 2024 Phase – I is Opened",
      html: emailHtml,
    };
    await sendMail(options);
  } catch (error) {
    console.log("stmp error");

    throw error;
  }
};
