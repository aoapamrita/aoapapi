import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import VendorWelcome from "../../emails/vendorwelcome";
import VendorPassReset from "../../emails/vendorpassreset";

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

export const sendWelcomeMailVendor = async (vendor) => {
  const emailHtml = render(
    VendorWelcome({
      username: vendor.email,
      password: vendor.password,
    })
  );
  var options = {
    from: '"Directorate of Admissions - Amrita Vishwa Vidyapeetham" <noreply@amrita.edu>',
    to: vendor.email,
    subject: "Welcome to the Amrita Online Admission Portal (AOAP)",
    html: emailHtml,
  };
  sendMail(options);
};

export const sendPasswordMailVendor = async (vendor) => {
  const emailHtml = render(
    VendorPassReset({
      password: vendor.password,
    })
  );
  var options = {
    from: '"Directorate of Admissions - Amrita Vishwa Vidyapeetham" <noreply@amrita.edu>',
    to: vendor.email,
    subject: "Your new AOAP Credentials",
    html: emailHtml,
  };
  sendMail(options);
};
