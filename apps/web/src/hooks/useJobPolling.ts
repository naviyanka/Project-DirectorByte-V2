import { useState, useEffect, useRef } from 'react';
import { projectsService, GenerationJob } from '../services/projects.service';

interface UseJobPollingOptions {
  interval?: number;
  onComplete?: (job: GenerationJob) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function useJobPolling(jobId: string | null, options: UseJobPollingOptions = {}) {
  const { interval = 3000, onComplete, onError, enabled = true } = options;
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId || !enabled) {
      setJob(null);
      setIsPolling(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const poll = async () => {
      try {
        const currentJob = await projectsService.getJob(jobId);
        setJob(currentJob);
        setIsPolling(true);

        if (currentJob.status === 'COMPLETED') {
          setIsPolling(false);
          if (timerRef.current) clearInterval(timerRef.current);
          onComplete?.(currentJob);
        } else if (currentJob.status === 'FAILED') {
          setIsPolling(false);
          if (timerRef.current) clearInterval(timerRef.current);
          onError?.(currentJob.errorMessage || 'Generation failed');
        }
      } catch (err: any) {
        console.error('Job Polling Error:', err);
        // We don't stop polling on network error, just wait for next tick
      }
    };

    // Initial poll
    poll();

    timerRef.current = setInterval(poll, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId, enabled, interval, onComplete, onError]);

  return { job, isPolling };
}
