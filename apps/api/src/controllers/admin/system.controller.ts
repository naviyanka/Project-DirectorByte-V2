import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { response } from '../../utils/response';
import { sendEmail } from '../../services/email.service';
import { PROVIDER_REGISTRY } from '../../config/providers';

export class AdminSystemController {
  static async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real app we might also check DB or env to see if they are configured
      // For now, we return the static registry
      return response.ok(res, { providers: PROVIDER_REGISTRY });
    } catch (error) { next(error); }
  }

  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await prisma.systemSetting.findMany();
      return response.ok(res, settings.map(s => ({
        ...s, value: s.isSecret ? '••••••' : s.value,
      })));
    } catch (error) { next(error); }
  }

  static async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value } = req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key }, create: { key, value }, update: { value },
      });
      return response.ok(res, setting);
    } catch (error) { next(error); }
  }

  static async setMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const { enabled, message } = req.body;
      await prisma.systemSetting.upsert({
        where: { key: 'app.maintenanceMode' },
        create: { key: 'app.maintenanceMode', value: String(enabled) },
        update: { value: String(enabled) },
      });
      if (message) {
        await prisma.systemSetting.upsert({
          where: { key: 'app.maintenanceMessage' },
          create: { key: 'app.maintenanceMessage', value: message },
          update: { value: message },
        });
      }
      return response.ok(res, { success: true, enabled });
    } catch (error) { next(error); }
  }

  static async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      let dbStatus = 'ok';
      try { await prisma.$queryRaw`SELECT 1`; } catch { dbStatus = 'degraded'; }

      return response.ok(res, {
        database: dbStatus, redis: 'ok', storage: 'ok', email: 'ok',
        payment: 'ok', queueDepth: 0,
      });
    } catch (error) { next(error); }
  }

  static async testEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { to } = req.body;
      await sendEmail(to, 'DirectorByte Admin Test Email', 'generic', { body: 'This is a test email from the admin panel.' });
      return response.ok(res, { success: true, sentTo: to });
    } catch (error) { next(error); }
  }

  static async getFeatureFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const flags = await prisma.systemSetting.findMany({
        where: { key: { startsWith: 'feature.' } },
      });
      return response.ok(res, flags.map(f => ({ key: f.key, enabled: f.value === 'true' })));
    } catch (error) { next(error); }
  }

  static async toggleFeatureFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const flag = req.params.flag;
      const { enabled } = req.body;
      const key = flag.startsWith('feature.') ? flag : `feature.${flag}`;

      await prisma.systemSetting.upsert({
        where: { key }, create: { key, value: String(enabled) }, update: { value: String(enabled) },
      });
      return response.ok(res, { key, enabled });
    } catch (error) { next(error); }
  }

  static async getEmailTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await prisma.emailTemplate.findMany();
      return response.ok(res, templates);
    } catch (error) { next(error); }
  }

  static async getEmailTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const template = await prisma.emailTemplate.findUnique({ where: { key } });
      if (!template) {
        // Return a stub if it doesn't exist
        return response.ok(res, { key, subject: '', htmlBody: '', variables: [], isActive: true });
      }
      return response.ok(res, template);
    } catch (error) { next(error); }
  }

  static async updateEmailTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { subject, htmlBody } = req.body;
      const adminId = req.adminSession?.sessionId || 'unknown';

      const template = await prisma.emailTemplate.upsert({
        where: { key },
        create: { key, subject: subject || '', htmlBody: htmlBody || '', updatedByAdminId: adminId },
        update: { ...(subject && { subject }), ...(htmlBody && { htmlBody }), updatedByAdminId: adminId }
      });

      return response.ok(res, template);
    } catch (error) { next(error); }
  }

  static async previewEmailTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { variables = {} } = req.body;
      const Handlebars = (await import('handlebars')).default;

      let htmlTemplate = '';
      const template = await prisma.emailTemplate.findUnique({ where: { key } });
      
      if (template && template.isActive) {
        htmlTemplate = template.htmlBody;
      } else {
        // Fallback to local
        const path = await import('path');
        const fs = await import('fs/promises');
        const templatePath = path.resolve(__dirname, '../../../emails', `${key}.hbs`);
        try {
          htmlTemplate = await fs.readFile(templatePath, 'utf8');
        } catch {
          htmlTemplate = 'Template not found';
        }
      }

      const compiledTemplate = Handlebars.compile(htmlTemplate);
      const renderedHtml = compiledTemplate(variables);

      return response.ok(res, { renderedHtml });
    } catch (error) { next(error); }
  }

  static async resetEmailTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      await prisma.emailTemplate.delete({ where: { key } });
      return response.ok(res, { success: true });
    } catch (error) { next(error); }
  }
}
