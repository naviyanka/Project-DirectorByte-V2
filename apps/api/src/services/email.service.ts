import { transporter } from '../config/email';
import { env } from '../config/env';
import { logger } from '../config/logger';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

import { prisma } from '../config/database';

// Basic synchronous email service without BullMQ for now
export const sendEmail = async (to: string, subject: string, templateName: string, context: any) => {
  try {
    let source = '';
    let finalSubject = subject;

    // 1. Check DB First
    try {
      const dbTemplate = await prisma.emailTemplate.findUnique({
        where: { key: templateName }
      });
      if (dbTemplate && dbTemplate.isActive) {
        source = dbTemplate.htmlBody;
        finalSubject = dbTemplate.subject;
      }
    } catch (e) {
      logger.error({ err: e }, `Failed to fetch template ${templateName} from DB`);
    }

    // 2. Fallback to File if DB not found or failed
    if (!source) {
      const templatePath = path.join(__dirname, `../templates/emails/${templateName}.hbs`);
      try {
        source = await fs.readFile(templatePath, 'utf8');
      } catch (e) {
        logger.error(`Email template not found: ${templateName}`);
        return;
      }
    }

    const template = handlebars.compile(source);
    const html = template({ ...context, appName: env.APP_NAME });

    const mailOptions = {
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    };

    if (env.NODE_ENV === 'development') {
      logger.info(`[Email Service] Simulating send to ${to}: ${subject}`);
      // In development, you might not have real SMTP set up, so we just log it.
      // Uncomment below to actually send in dev if SMTP is configured:
      // await transporter.sendMail(mailOptions);
    } else {
      await transporter.sendMail(mailOptions);
      logger.info(`[Email Service] Sent email to ${to}: ${subject}`);
    }
  } catch (error) {
    logger.error({ err: error }, `Failed to send email to ${to}`);
  }
};
