import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { EncryptionService } from '../services/encryption.service';
import { NotFoundError } from '../utils/errors';
import { PROVIDER_REGISTRY } from '../config/providers';

export class ApiKeyController {
  static async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      return response.ok(res, PROVIDER_REGISTRY);
    } catch (error) {
      next(error);
    }
  }

  static async getKeys(req: Request, res: Response, next: NextFunction) {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId: req.user!.id }
      });

      // Group by module, omitting the encrypted value
      const grouped: Record<string, any[]> = {};
      
      for (const key of keys) {
        if (!grouped[key.module]) {
          grouped[key.module] = [];
        }
        
        grouped[key.module].push({
          id: key.id,
          provider: key.provider,
          keyType: key.keyType,
          keyHint: key.keyHint,
          isActive: key.isActive,
          lastTestedAt: key.lastTestedAt,
          lastTestStatus: key.lastTestStatus,
          lastTestError: key.lastTestError,
        });
      }

      return response.ok(res, grouped);
    } catch (error) {
      next(error);
    }
  }

  static async createKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { module, provider, apiKey } = req.body;

      // Extract last 4 chars for hint
      const hintLength = Math.min(4, apiKey.length);
      const keyHint = '...' + apiKey.slice(-hintLength);

      const encryptedKey = EncryptionService.encrypt(apiKey);

      // Deactivate existing keys for same provider
      await prisma.apiKey.updateMany({
        where: {
          userId: req.user!.id,
          module: module as any,
          provider
        },
        data: { isActive: false }
      });

      const newKey = await prisma.apiKey.create({
        data: {
          userId: req.user!.id,
          module: module as any,
          provider,
          encryptedKey,
          keyHint,
          keyType: 'USER_PROVIDED',
          isActive: true
        }
      });

      return response.created(res, {
        id: newKey.id,
        module: newKey.module,
        provider: newKey.provider,
        keyType: newKey.keyType,
        keyHint: newKey.keyHint,
        isActive: newKey.isActive
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { apiKey, isActive, provider } = req.body;

      const existing = await prisma.apiKey.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.id) {
        throw new NotFoundError('API Key');
      }

      const updates: any = {};
      if (isActive !== undefined) updates.isActive = isActive;
      if (provider !== undefined) updates.provider = provider;
      
      if (apiKey) {
        updates.encryptedKey = EncryptionService.encrypt(apiKey);
        const hintLength = Math.min(4, apiKey.length);
        updates.keyHint = '...' + apiKey.slice(-hintLength);
      }

      const updated = await prisma.apiKey.update({
        where: { id },
        data: updates
      });

      return response.ok(res, {
        id: updated.id,
        module: updated.module,
        provider: updated.provider,
        keyType: updated.keyType,
        keyHint: updated.keyHint,
        isActive: updated.isActive
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.apiKey.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.id) {
        throw new NotFoundError('API Key');
      }

      await prisma.apiKey.delete({ where: { id } });
      
      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async testKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.apiKey.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.id) {
        throw new NotFoundError('API Key');
      }

      const rawKey = EncryptionService.decrypt(existing.encryptedKey);
      
      const startTime = Date.now();
      let status = 'error';
      let message = 'Failed to validate key';

      try {
        // Stub: MOCK external provider test.
        // In a real implementation, we would make a lightweight request to the provider's `/v1/models` or similar endpoint.
        if (rawKey.length > 10) {
          status = 'ok';
          message = 'Key is valid';
        } else {
          throw new Error('Key format invalid or rejected by provider');
        }
      } catch (err: any) {
        status = 'error';
        message = err.message || 'Validation failed';
      }

      const latencyMs = Date.now() - startTime;

      await prisma.apiKey.update({
        where: { id },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: status === 'ok' ? 'SUCCESS' : 'FAILED',
          lastTestError: status === 'ok' ? null : message
        }
      });

      return response.ok(res, { status, message, latencyMs });
    } catch (error) {
      next(error);
    }
  }
}
