import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { getProvider } from '../providers/ai/provider.factory';
import { getEnv } from '../config/env';
import { GenerationJobStatus } from '@prisma/client';

class StudioWorkerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private pollIntervalMs = 10000; // 10 seconds

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.processJobs(), this.pollIntervalMs);
    logger.info('[StudioWorker] Background processing service started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('[StudioWorker] Background processing service stopped');
  }

  private async processJobs() {
    try {
      // Find jobs that are in PROCESSING state (which means they were sent to provider but we are waiting for result)
      // Also pick up QUEUED jobs that haven't been started yet.
      
      const queuedJobs = await prisma.generationJob.findMany({
        where: { status: GenerationJobStatus.QUEUED },
        take: 5
      });

      for (const job of queuedJobs) {
        // Start the job asynchronously (don't block the loop)
        this.executeJob(job).catch(err => {
          logger.error({ err, jobId: job.id }, 'Error executing queued job');
        });
      }

      // Find processing jobs to poll
      // (For real robustness, we should track provider job IDs inside inputPayload/outputPayload)
      // Since polling is handled via `pollUntilComplete` directly inside `executeJob` using native async,
      // we don't strictly need to repeatedly pick up PROCESSING jobs from DB unless the server restarted.
      // If server restarts, we should re-attach to PROCESSING jobs.
      const processingJobs = await prisma.generationJob.findMany({
        where: { status: GenerationJobStatus.PROCESSING },
      });
      
      for (const job of processingJobs) {
        // Check if it's been processing for too long (e.g. server crash)
        // If it lacks a providerJobID, it might be stuck
        const inputPayload = job.inputPayload as any;
        const providerJobId = inputPayload?.providerJobId;
        
        if (providerJobId) {
          // Re-attach polling
          this.pollUntilComplete(job, providerJobId).catch(err => {
            logger.error({ err, jobId: job.id }, 'Error re-polling processing job');
          });
        }
      }

    } catch (error) {
      logger.error({ err: error }, '[StudioWorker] Error in process loop');
    }
  }

  private async executeJob(job: any) {
    try {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: GenerationJobStatus.PROCESSING, startedAt: new Date() }
      });

      // Get API Key for the user's provider (For platform providers, fetch from env or mock)
      const apiKey = this.getPlatformKey(job.provider);
      
      const provider = getProvider(job.provider, apiKey);
      const inputPayload = job.inputPayload as any;

      if (job.module === 'VIDEO_GEN') {
        if (!provider.generateVideo) throw new Error('Provider does not support Video Gen');
        const res = await provider.generateVideo(inputPayload.prompt, inputPayload.options);
        
        await prisma.generationJob.update({
          where: { id: job.id },
          data: { inputPayload: { ...inputPayload, providerJobId: res.jobId } }
        });

        await this.pollUntilComplete(job, res.jobId);
        
      } else if (job.module === 'AUDIO_GEN') {
        if (!provider.generateAudio) throw new Error('Provider does not support Audio Gen');
        const res = await provider.generateAudio(inputPayload.prompt, inputPayload.options);
        
        if (res.jobId) {
          await prisma.generationJob.update({
            where: { id: job.id },
            data: { inputPayload: { ...inputPayload, providerJobId: res.jobId } }
          });
          await this.pollUntilComplete(job, res.jobId);
        } else if (res.audioUrl || res.audioBase64) {
          // Synchronous finish
          await this.finishJob(job.id, res);
        }
        
      } else if (job.module === 'VOICEOVER') {
        if (!provider.synthesizeSpeech) throw new Error('Provider does not support Voiceover');
        const res = await provider.synthesizeSpeech(inputPayload.text, inputPayload.options);
        await this.finishJob(job.id, res);
      } else {
        throw new Error('Unsupported AI Module in StudioWorker');
      }

    } catch (error: any) {
      await this.failJob(job.id, error.message);
    }
  }

  private async pollUntilComplete(job: any, providerJobId: string, maxWaitMinutes = 10) {
    const pollIntervalMs = 5000;
    const maxPolls = (maxWaitMinutes * 60 * 1000) / pollIntervalMs;

    const apiKey = this.getPlatformKey(job.provider);
    const provider = getProvider(job.provider, apiKey);

    for (let i = 0; i < maxPolls; i++) {
      try {
        let result: any = null;
        if (job.module === 'VIDEO_GEN') {
          result = await provider.pollVideoJob!(providerJobId);
        } else if (job.module === 'AUDIO_GEN') {
          result = await provider.pollAudioJob!(providerJobId);
        }

        if (result) {
          const progress = result.progress ?? Math.min(i * 5, 90);
          await prisma.generationJob.update({
            where: { id: job.id },
            data: { progress }
          });

          if (result.status === 'SUCCEEDED' || result.status === 'completed') {
            await this.finishJob(job.id, result);
            return;
          }
          if (result.status === 'FAILED' || result.status === 'error') {
            throw new Error(result.errorMessage ?? 'Generation failed at provider');
          }
        }
      } catch (err: any) {
        // If it's a polling error (like 500 from provider), we log and retry until maxWait
        // If it's explicitly FAILED from provider, we throw to failJob
        if (err.message.includes('Generation failed')) {
          await this.failJob(job.id, err.message);
          return;
        }
        logger.warn({ err, providerJobId }, 'Polling error, retrying...');
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    await this.failJob(job.id, `Generation timed out after ${maxWaitMinutes} minutes`);
  }

  private async finishJob(jobId: string, result: any) {
    // In a full implementation, we'd upload outputUrl or base64 to StorageService here.
    // For Phase 07B, we'll store the direct URL or base64 into outputPayload.
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: GenerationJobStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
        outputPayload: result
      }
    });
    logger.info(`[StudioWorker] Job ${jobId} completed successfully`);
  }

  private async failJob(jobId: string, errorMessage: string) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: GenerationJobStatus.FAILED,
        failedAt: new Date(),
        errorMessage
      }
    });
    logger.error(`[StudioWorker] Job ${jobId} failed: ${errorMessage}`);
  }

  private getPlatformKey(providerName: string): string | undefined {
    switch(providerName.toLowerCase()) {
      case 'runwayml': return getEnv().PLATFORM_RUNWAYML_API_KEY;
      case 'kling': 
        if (getEnv().PLATFORM_KLING_ACCESS_KEY && getEnv().PLATFORM_KLING_SECRET_KEY) {
          return `${getEnv().PLATFORM_KLING_ACCESS_KEY}:${getEnv().PLATFORM_KLING_SECRET_KEY}`;
        }
        return undefined;
      case 'pika': return getEnv().PLATFORM_PIKA_API_KEY;
      case 'suno': return getEnv().PLATFORM_SUNO_API_KEY;
      case 'mubert': return getEnv().PLATFORM_MUBERT_API_KEY;
      case 'elevenlabs': return getEnv().PLATFORM_ELEVENLABS_API_KEY;
      case 'playht': 
        if (getEnv().PLATFORM_PLAYHT_USER_ID && getEnv().PLATFORM_PLAYHT_API_KEY) {
          return `${getEnv().PLATFORM_PLAYHT_USER_ID}:${getEnv().PLATFORM_PLAYHT_API_KEY}`;
        }
        return undefined;
      case 'google-tts': return undefined; // Free tier or application default credentials
      default: return undefined;
    }
  }
}

export const studioWorker = new StudioWorkerService();
