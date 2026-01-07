import nodemailer from "nodemailer";
import { config } from "../config";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function ensureEmailConfig() {
  const { host, port, user, password, from } = config.email;
  if (!host || !port || !user || !password || !from) {
    throw new Error("Missing email config. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM.");
  }
  return { host, port, user, password, from, secure: config.email.secure ?? false };
}

export async function sendEmail(payload: EmailPayload) {
  const emailConfig = ensureEmailConfig();
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  await transporter.sendMail({
    from: emailConfig.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
