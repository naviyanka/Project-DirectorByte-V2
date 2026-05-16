import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { response } from '../utils/response';
import { NotFoundError, AppError } from '../utils/errors';
import { env } from '../config/env';
import { getProvider } from '../providers/ai/provider.factory';

export class StudioController {
  static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, projectId, module, page = 1, perPage = 20 } = req.query;

      const where: any = { userId: req.user!.id };
      if (status) where.status = status;
      if (projectId) where.projectId = projectId;
      if (module) where.module = module;

      const total = await prisma.generationJob.count({ where });
      const jobs = await prisma.generationJob.findMany({
        where,
        orderBy: { queuedAt: 'desc' },
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage)
      });

      return response.paginated(res, jobs, {
        page: Number(page),
        perPage: Number(perPage),
        total,
        totalPages: Math.ceil(total / Number(perPage))
      });
    } catch (error) {
      next(error);
    }
  }

  static async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const job = await prisma.generationJob.findUnique({ where: { id } });
      if (!job || job.userId !== req.user!.id) {
        throw new NotFoundError('Job');
      }

      return response.ok(res, job);
    } catch (error) {
      next(error);
    }
  }

  static async cancelJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const job = await prisma.generationJob.findUnique({ where: { id } });
      if (!job || job.userId !== req.user!.id) {
        throw new NotFoundError('Job');
      }

      if (['COMPLETED', 'FAILED', 'CANCELED'].includes(job.status)) {
        return response.badRequest(res, 'INVALID_STATE', `Cannot cancel a job in ${job.status} state`);
      }

      // In a real app with BullMQ, we would remove the job from the queue here

      const updated = await prisma.generationJob.update({
        where: { id },
        data: {
          status: 'CANCELED',
          failedAt: new Date(),
          errorMessage: 'Canceled by user'
        }
      });

      return response.ok(res, { success: true, status: updated.status });
    } catch (error) {
      next(error);
    }
  }

  static async transcribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { audioUrl, projectId } = req.body;
      const userId = req.user!.id;

      // Check credit balance (transcription costs 5 credits)
      const usage = await prisma.subscriptionUsage.findFirst({
        where: { userId },
        orderBy: { periodStart: 'desc' }
      });

      if (!usage || usage.creditsUsed + 5 > usage.creditsLimit) {
        throw new AppError('Insufficient credits for transcription (requires 5 credits)', 402, 'INSUFFICIENT_CREDITS');
      }

      // Check for API key
      const apiKey = await prisma.apiKey.findFirst({
        where: { userId, provider: 'openai', isActive: true }
      });
      const keyToUse = apiKey?.encryptedKey || process.env.PLATFORM_WHISPER_API_KEY || process.env.PLATFORM_OPENAI_API_KEY;
      
      if (!keyToUse) {
        throw new AppError('Add an OpenAI API key to use transcription', 402, 'MISSING_API_KEY');
      }

      // Fetch the audio file
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error('Failed to fetch audio file');
      const audioBuffer = await audioRes.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: audioRes.headers.get('content-type') || 'audio/mpeg' });

      // Build form data for Whisper API
      const formData = new FormData();
      formData.append('file', blob, 'audio.mp3');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyToUse}`
        },
        body: formData
      });

      if (!whisperRes.ok) {
        const errorData = await whisperRes.json();
        throw new Error(`Whisper API error: ${JSON.stringify(errorData)}`);
      }

      const data: any = await whisperRes.json();
      const segments = data.segments || [];

      // Format as SRT and VTT
      const formatTimeSRT = (seconds: number) => {
        const date = new Date(seconds * 1000);
        const hh = String(date.getUTCHours()).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss},${ms}`;
      };

      const formatTimeVTT = (seconds: number) => {
        const date = new Date(seconds * 1000);
        const hh = String(date.getUTCHours()).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
      };

      let srt = '';
      let vtt = 'WEBVTT\n\n';

      segments.forEach((seg: any, i: number) => {
        const startSRT = formatTimeSRT(seg.start);
        const endSRT = formatTimeSRT(seg.end);
        srt += `${i + 1}\n${startSRT} --> ${endSRT}\n${seg.text.trim()}\n\n`;

        const startVTT = formatTimeVTT(seg.start);
        const endVTT = formatTimeVTT(seg.end);
        vtt += `${startVTT} --> ${endVTT}\n${seg.text.trim()}\n\n`;
      });

      // Deduct credits
      await prisma.subscriptionUsage.update({
        where: { id: usage.id },
        data: { creditsUsed: { increment: 5 } }
      });

      return response.ok(res, { segments, srt: srt.trim(), vtt: vtt.trim() });
    } catch (error) {
      next(error);
    }
  }

  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, module, provider, model, inputPayload } = req.body;
      const userId = req.user!.id;

      // 1. Verify project ownership
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.userId !== userId) throw new NotFoundError('Project');

      // 2. Check credits
      const usage = await prisma.subscriptionUsage.findFirst({
        where: { userId },
        orderBy: { periodStart: 'desc' }
      });

      // Simple credit cost mapping (mocked logic)
      const creditCost = module === 'VIDEO_GEN' ? 50 : module === 'IMAGE_GEN' ? 5 : 2;
      
      if (!usage || usage.creditsUsed + creditCost > usage.creditsLimit) {
        throw new AppError(`Insufficient credits. Required: ${creditCost}`, 402, 'INSUFFICIENT_CREDITS');
      }

      // 3. Create Job
      const job = await prisma.generationJob.create({
        data: {
          projectId,
          userId,
          module: module as any,
          provider,
          model,
          inputPayload,
          status: 'QUEUED',
          estimatedCredits: creditCost
        }
      });

      // 4. Deduct credits immediately (reserve)
      await prisma.subscriptionUsage.update({
        where: { id: usage.id },
        data: { creditsUsed: { increment: creditCost } }
      });

      return response.created(res, job);
    } catch (error) {
      next(error);
    }
  }

  static async getVoices(req: Request, res: Response, next: NextFunction) {
    try {
      const providerName = req.query.provider as string;
      if (!providerName) {
        return response.badRequest(res, 'MISSING_PROVIDER', 'Provider is required');
      }

      let apiKey: string | undefined;
      // In a real implementation we would fetch the user's API key if they provided one
      // For now we try to use the platform key if available
      switch(providerName.toLowerCase()) {
        case 'elevenlabs': apiKey = env.PLATFORM_ELEVENLABS_API_KEY; break;
        case 'playht': 
          if (env.PLATFORM_PLAYHT_USER_ID && env.PLATFORM_PLAYHT_API_KEY) {
            apiKey = `${env.PLATFORM_PLAYHT_USER_ID}:${env.PLATFORM_PLAYHT_API_KEY}`;
          }
          break;
        case 'google-tts': apiKey = undefined; break;
      }

      const provider = getProvider(providerName, apiKey);
      if (!provider.listVoices) {
        return response.badRequest(res, 'UNSUPPORTED', 'Provider does not support listing voices');
      }

      const voices = await provider.listVoices(apiKey);
      return response.ok(res, { voices });
    } catch (error) {
      next(error);
    }
  }
}
