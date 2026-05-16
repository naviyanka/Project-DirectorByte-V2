import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { NotFoundError, ForbiddenError, AppError } from '../utils/errors';
import crypto from 'crypto';

export class ProjectController {
  static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, page = 1, perPage = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

      const where: any = {
        userId: req.user!.id,
        deletedAt: null
      };

      if (status) where.status = status;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const total = await prisma.project.count({ where });
      
      const projects = await prisma.project.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder },
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage),
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          status: true,
          currentStage: true,
          createdAt: true,
          updatedAt: true,
          storageSizeBytes: true
        }
      });

      return response.paginated(res, projects, {
        page: Number(page),
        perPage: Number(perPage),
        total,
        totalPages: Math.ceil(total / Number(perPage))
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, genre, style, duration, pipelineConfig } = req.body;

      // Enforce limits
      const usage = await prisma.subscriptionUsage.findFirst({
        where: { userId: req.user!.id },
        orderBy: { periodStart: 'desc' }
      });

      if (usage && usage.projectsLimit && usage.projectsCount >= usage.projectsLimit) {
        throw new ForbiddenError('Project limit reached. Please upgrade your plan.');
      }

      const project = await prisma.$transaction(async (tx) => {
        const newProject = await tx.project.create({
          data: {
            userId: req.user!.id,
            title,
            description,
            genre,
            style,
            duration,
            pipelineConfig: pipelineConfig || {},
            status: 'DRAFT'
          }
        });

        if (usage) {
          await tx.subscriptionUsage.update({
            where: { id: usage.id },
            data: { projectsCount: { increment: 1 } }
          });
        }

        return newProject;
      });

      return response.created(res, project);
    } catch (error) {
      next(error);
    }
  }

  static async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt) {
        throw new NotFoundError('Project');
      }

      if (project.userId !== req.user!.id) {
        throw new ForbiddenError();
      }

      return response.ok(res, project);
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      const updated = await prisma.project.update({
        where: { id },
        data: req.body // Zod validation ensures only valid fields
      });

      return response.ok(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id },
          data: { deletedAt: new Date() }
        });

        const usage = await tx.subscriptionUsage.findFirst({
          where: { userId: req.user!.id },
          orderBy: { periodStart: 'desc' }
        });

        if (usage && usage.projectsCount > 0) {
          await tx.subscriptionUsage.update({
            where: { id: usage.id },
            data: { projectsCount: { decrement: 1 } }
          });
        }
      });

      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async restoreProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      if (!project.deletedAt) {
        return response.ok(res, project);
      }

      // Check if it's within 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (project.deletedAt < thirtyDaysAgo) {
        throw new AppError('Cannot restore projects deleted more than 30 days ago', 400, 'RESTORE_EXPIRED');
      }

      // Re-check limits
      const usage = await prisma.subscriptionUsage.findFirst({
        where: { userId: req.user!.id },
        orderBy: { periodStart: 'desc' }
      });

      if (usage && usage.projectsLimit && usage.projectsCount >= usage.projectsLimit) {
        throw new ForbiddenError('Project limit reached. Cannot restore.');
      }

      const restored = await prisma.$transaction(async (tx) => {
        const p = await tx.project.update({
          where: { id },
          data: { deletedAt: null }
        });

        if (usage) {
          await tx.subscriptionUsage.update({
            where: { id: usage.id },
            data: { projectsCount: { increment: 1 } }
          });
        }

        return p;
      });

      return response.ok(res, restored);
    } catch (error) {
      next(error);
    }
  }

  static async duplicateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      const usage = await prisma.subscriptionUsage.findFirst({
        where: { userId: req.user!.id },
        orderBy: { periodStart: 'desc' }
      });

      if (usage && usage.projectsLimit && usage.projectsCount >= usage.projectsLimit) {
        throw new ForbiddenError('Project limit reached. Please upgrade your plan.');
      }

      const duplicate = await prisma.$transaction(async (tx) => {
        const p = await tx.project.create({
          data: {
            userId: req.user!.id,
            title: `Copy of ${project.title}`,
            description: project.description,
            genre: project.genre,
            style: project.style,
            duration: project.duration,
            pipelineConfig: project.pipelineConfig || {},
            status: 'DRAFT'
          }
        });

        if (usage) {
          await tx.subscriptionUsage.update({
            where: { id: usage.id },
            data: { projectsCount: { increment: 1 } }
          });
        }

        return p;
      });

      return response.created(res, duplicate);
    } catch (error) {
      next(error);
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      const updated = await prisma.project.update({
        where: { id },
        data: { status }
      });

      return response.ok(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async createVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { snapshot, triggeredBy = 'USER_MANUAL' } = req.body;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      // Check version limits (keep last 50)
      const versionCount = await prisma.projectVersion.count({ where: { projectId: id } });
      
      if (versionCount >= 50) {
        // Delete oldest
        const oldest = await prisma.projectVersion.findFirst({
          where: { projectId: id },
          orderBy: { createdAt: 'asc' }
        });
        if (oldest) {
          await prisma.projectVersion.delete({ where: { id: oldest.id } });
        }
      }

      const newVersionNum = versionCount > 0 ? versionCount + 1 : 1;

      const version = await prisma.projectVersion.create({
        data: {
          projectId: id,
          version: newVersionNum,
          snapshot,
          triggeredBy
        }
      });

      await prisma.project.update({
        where: { id },
        data: { lastAutoSavedAt: new Date() }
      });

      return response.created(res, { versionId: version.id });
    } catch (error) {
      next(error);
    }
  }

  static async getVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      const versions = await prisma.projectVersion.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, version: true, triggeredBy: true, createdAt: true }
      });

      return response.ok(res, versions);
    } catch (error) {
      next(error);
    }
  }

  static async getVersionSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, versionId } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      const version = await prisma.projectVersion.findUnique({ where: { id: versionId } });
      if (!version || version.projectId !== id) {
        throw new NotFoundError('Version');
      }

      return response.ok(res, { snapshot: version.snapshot });
    } catch (error) {
      next(error);
    }
  }

  static async restoreVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, versionId } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      const version = await prisma.projectVersion.findUnique({ where: { id: versionId } });
      if (!version || version.projectId !== id) {
        throw new NotFoundError('Version');
      }

      // Safety snapshot before restore
      const currentSnapshot = project.pipelineConfig; // Assuming pipelineConfig holds the state we restore
      
      const versionCount = await prisma.projectVersion.count({ where: { projectId: id } });
      await prisma.projectVersion.create({
        data: {
          projectId: id,
          version: versionCount + 1,
          snapshot: currentSnapshot as any,
          triggeredBy: 'SYSTEM_RESTORE_BACKUP'
        }
      });

      // Restore
      await prisma.project.update({
        where: { id },
        data: { pipelineConfig: version.snapshot as any }
      });

      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async shareProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      let shareToken = project.shareToken;
      if (!shareToken) {
        shareToken = crypto.randomBytes(16).toString('hex');
      }

      await prisma.project.update({
        where: { id },
        data: { shareEnabled: true, shareToken }
      });

      // Assuming frontend URL comes from env
      const shareUrl = `${process.env.APP_URL}/shared/${shareToken}`;

      return response.ok(res, { shareUrl, shareToken });
    } catch (error) {
      next(error);
    }
  }

  static async unshareProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      await prisma.project.update({
        where: { id },
        data: { shareEnabled: false, shareToken: null }
      });

      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }

  static async getSharedProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      const project = await prisma.project.findFirst({
        where: { shareToken: token, shareEnabled: true, deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          genre: true,
          style: true,
          currentStage: true
        }
      });

      if (!project) {
        throw new NotFoundError('Shared Project');
      }

      return response.ok(res, project);
    } catch (error) {
      next(error);
    }
  }

  static async setThumbnail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      // In a full implementation we would fetch, resize via sharp, and re-upload.
      // For now, we assume the imageUrl is valid.
      const updated = await prisma.project.update({
        where: { id },
        data: { thumbnailUrl: imageUrl }
      });

      return response.ok(res, { thumbnailUrl: updated.thumbnailUrl });
    } catch (error) {
      next(error);
    }
  }

  static async removeThumbnail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.deletedAt || project.userId !== req.user!.id) {
        throw new NotFoundError('Project');
      }

      await prisma.project.update({
        where: { id },
        data: { thumbnailUrl: null }
      });

      return response.ok(res, { success: true });
    } catch (error) {
      next(error);
    }
  }
}
