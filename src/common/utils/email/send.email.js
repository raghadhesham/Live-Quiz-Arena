import { createTransport } from "nodemailer";
import { config } from "../../../DB/config/configServices.js";

export const sendEmail = async ({
  from,
  to,
  subject,
  html,
  attachments = [],
}) => {
  const transporter = createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: { 
      user: config.email.email, 
      pass: config.email.password, 
    }, 
  });
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    attachments,
  });
  return info.accepted.length ? true : false;
};
export const generateOTP = async () => {
  return Math.floor(100000 + Math.random() * 900000);
};
