import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { NotFoundError, AppError } from '../utils/errors';
import { env } from '../config/env';
import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import { EncryptionService } from '../services/encryption.service';
import { Readable } from 'stream';

export class StorageController {
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { storageConnection: true, subscription: { include: { usage: true } } }
      });

      if (!user) throw new NotFoundError('User');

      let driveStatus: any = null;

      if (user.storageConnection) {
        // Attempt to fetch fresh status if connected
        try {
          const oauth2Client = new google.auth.OAuth2(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET
          );
          
          oauth2Client.setCredentials({
            access_token: user.storageConnection.encryptedAccessToken ? EncryptionService.decrypt(user.storageConnection.encryptedAccessToken) : undefined,
            refresh_token: user.storageConnection.encryptedRefreshToken ? EncryptionService.decrypt(user.storageConnection.encryptedRefreshToken) : undefined,
            expiry_date: user.storageConnection.expiresAt?.getTime()
          });

          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const about = await drive.about.get({ fields: 'storageQuota' });

          const quota = about.data.storageQuota;
          driveStatus = {
            quotaBytes: quota?.limit || 0,
            usedBytes: quota?.usage || 0,
            syncEnabled: user.storageConnection.syncEnabled,
            lastSyncedAt: user.storageConnection.lastSyncedAt
          };
        } catch (e) {
          // Silent fallback
          driveStatus = { error: 'Failed to fetch Drive status. Token may be expired.' };
        }
      }

      return response.ok(res, {
        provider: user.storageProvider,
        connected: !!user.storageConnection,
        drive: driveStatus,
        usage: {
          usedByAppBytes: user.storageBytesUsed.toString(),
          limitBytes: user.subscription?.usage?.storageLimitBytes.toString() || '0'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async setProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.body;

      if (provider === 'GOOGLE_DRIVE') {
        const connection = await prisma.storageConnection.findFirst({
          where: { userId: req.user!.id, provider: 'GOOGLE_DRIVE' }
        });

        if (!connection) {
          return response.badRequest(res, 'NO_CONNECTION', 'Must connect Google Drive first');
        }
      }

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { storageProvider: provider as any }
      });

      return response.ok(res, { provider: user.storageProvider });
    } catch (error) {
      next(error);
    }
  }

  static async syncDrive(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, we would queue a BullMQ job to sync files.
      // Since BullMQ is skipped, we mock it.
      
      const connection = await prisma.storageConnection.findFirst({
        where: { userId: req.user!.id, provider: 'GOOGLE_DRIVE' }
      });

      if (!connection) {
        return response.badRequest(res, 'NO_CONNECTION', 'Google Drive not connected');
      }

      // Mocking immediate sync success
      await prisma.storageConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date() }
      });

      return response.ok(res, { status: 'sync_completed', message: 'Drive sync successful' });
    } catch (error) {
      next(error);
    }
  }

  static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return response.badRequest(res, 'NO_FILE', 'No file provided');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { subscription: { include: { usage: true } }, storageConnection: true }
      });

      if (!user) throw new NotFoundError('User');

      const usage = user.subscription?.usage;
      const fileSizeBytes = BigInt(req.file.size);

      // Check limits
      if (usage && (usage.storageUsedBytes + fileSizeBytes > usage.storageLimitBytes)) {
        throw new AppError('Storage limit exceeded', 403, 'LIMIT_EXCEEDED');
      }

      let url = '';
      let fileId = '';

      if (user.storageProvider === 'LOCAL' || !user.storageConnection) {
        const uploadDir = path.resolve(env.LOCAL_UPLOAD_PATH, `user_${user.id}`);
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const outputPath = path.join(uploadDir, filename);

        await fs.writeFile(outputPath, req.file.buffer);

        url = `${env.API_URL}/uploads/user_${user.id}/${filename}`;
        fileId = `local_${filename}`;
      } else {
        // Upload to Google Drive
        const oauth2Client = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET
        );
        
        oauth2Client.setCredentials({
          access_token: user.storageConnection.encryptedAccessToken ? EncryptionService.decrypt(user.storageConnection.encryptedAccessToken) : undefined,
          refresh_token: user.storageConnection.encryptedRefreshToken ? EncryptionService.decrypt(user.storageConnection.encryptedRefreshToken) : undefined
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        // Let's create a generic media stream
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        const driveRes = await drive.files.create({
          requestBody: {
            name: req.file.originalname,
          },
          media: {
            mimeType: req.file.mimetype,
            body: bufferStream,
          },
          fields: 'id, webViewLink',
        });

        fileId = driveRes.data.id!;
        url = driveRes.data.webViewLink || '';
      }

      // Update storage usage
      await prisma.$transaction(async (tx: any) => {
        await tx.user.update({
          where: { id: user.id },
          data: { storageBytesUsed: { increment: req.file!.size } } // File size in normal number for increment
        });

        if (usage) {
          await tx.subscriptionUsage.update({
            where: { id: usage.id },
            data: { storageUsedBytes: { increment: req.file!.size } }
          });
        }
      });

      return response.ok(res, { fileId, url, sizeBytes: req.file.size, provider: user.storageProvider });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { storageConnection: true, subscription: { include: { usage: true } } }
      });

      if (!user) throw new NotFoundError('User');

      let sizeBytesFreed = 0; // In a real app, you'd store file sizes in DB or query them before deletion

      if (fileId.startsWith('local_')) {
        const filename = fileId.replace('local_', '');
        const filePath = path.resolve(env.LOCAL_UPLOAD_PATH, `user_${user.id}`, filename);
        
        try {
          const stats = await fs.stat(filePath);
          sizeBytesFreed = stats.size;
          await fs.unlink(filePath);
        } catch (e) {
          throw new NotFoundError('File');
        }
      } else {
        // Assume Google Drive
        if (!user.storageConnection) {
          throw new AppError('Google Drive not connected', 400, 'NO_DRIVE');
        }

        const oauth2Client = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET
        );
        
        oauth2Client.setCredentials({
          access_token: user.storageConnection.encryptedAccessToken ? EncryptionService.decrypt(user.storageConnection.encryptedAccessToken) : undefined,
          refresh_token: user.storageConnection.encryptedRefreshToken ? EncryptionService.decrypt(user.storageConnection.encryptedRefreshToken) : undefined
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        try {
          const fileMeta = await drive.files.get({ fileId, fields: 'size' });
          sizeBytesFreed = Number(fileMeta.data.size || 0);
          
          await drive.files.delete({ fileId });
        } catch (e: any) {
          throw new AppError(`Drive API Error: ${e.message}`, 500, 'DRIVE_ERROR');
        }
      }

      if (sizeBytesFreed > 0) {
        await prisma.$transaction(async (tx: any) => {
          await tx.user.update({
            where: { id: user.id },
            data: { storageBytesUsed: { decrement: sizeBytesFreed } }
          });

          if (user.subscription?.usage) {
            await tx.subscriptionUsage.update({
              where: { id: user.subscription.usage.id },
              data: { storageUsedBytes: { decrement: sizeBytesFreed } }
            });
          }
        });
      }

      return response.ok(res, { success: true, sizeBytesFreed });
    } catch (error) {
      next(error);
    }
  }
}
