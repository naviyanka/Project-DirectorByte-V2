/**
 * Cleanup Background Jobs
 * - cleanup-expired-sessions (hourly)
 * - cleanup-deleted-projects (daily — soft-deleted > 30 days)
 */
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;

async function cleanupExpiredSessions() {
  try {
    const result = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const adminResult = await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    if (result.count > 0 || adminResult.count > 0) {
      logger.info({ sessions: result.count, adminSessions: adminResult.count }, 'Cleaned up expired sessions');
    }
  } catch (error) { logger.error({ err: error }, 'cleanupExpiredSessions failed'); }
}

async function cleanupDeletedProjects() {
  try {
    const cutoff = new Date(Date.now() - 30 * ONE_DAY);
    const result = await prisma.project.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    });
    if (result.count > 0) logger.info({ count: result.count }, 'Hard-deleted old projects');
  } catch (error) { logger.error({ err: error }, 'cleanupDeletedProjects failed'); }
}

let hourlyInterval: ReturnType<typeof setInterval> | null = null;
let dailyInterval: ReturnType<typeof setInterval> | null = null;

export function startCleanupJobs() {
  logger.info('Starting cleanup background jobs');
  cleanupExpiredSessions();
  hourlyInterval = setInterval(cleanupExpiredSessions, ONE_HOUR);
  cleanupDeletedProjects();
  dailyInterval = setInterval(cleanupDeletedProjects, ONE_DAY);
}

export function stopCleanupJobs() {
  if (hourlyInterval) { clearInterval(hourlyInterval); hourlyInterval = null; }
  if (dailyInterval) { clearInterval(dailyInterval); dailyInterval = null; }
}
