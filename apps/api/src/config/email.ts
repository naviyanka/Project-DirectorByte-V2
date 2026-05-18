import nodemailer from 'nodemailer';
import { getEnv } from './env';

let _transporter: nodemailer.Transporter | null = null;

export const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: getEnv().SMTP_HOST,
      port: getEnv().SMTP_PORT,
      secure: getEnv().SMTP_SECURE,
      auth: {
        user: getEnv().SMTP_USER,
        pass: getEnv().SMTP_PASS,
      },
    });
  }
  return _transporter;
};

// Use proxy for backwards compatibility if needed
export const transporter = new Proxy({} as nodemailer.Transporter, {
  get: (target, prop: keyof nodemailer.Transporter) => {
    const t = getTransporter();
    const value = t[prop];
    return typeof value === 'function' ? value.bind(t) : value;
  }
});
