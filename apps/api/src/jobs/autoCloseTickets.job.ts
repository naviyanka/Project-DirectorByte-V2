/**
 * Auto-Close Tickets Job (daily)
 * Closes tickets where autoCloseAt < now AND status != CLOSED
 */
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const ONE_DAY = 86400000;
let intervalId: ReturnType<typeof setInterval> | null = null;

async function autoCloseTickets() {
  try {
    const now = new Date();
    const result = await prisma.supportTicket.updateMany({
      where: { autoCloseAt: { lt: now }, status: { not: 'CLOSED' } },
      data: { status: 'CLOSED', closedAt: now },
    });
    if (result.count > 0) logger.info({ count: result.count }, 'Auto-closed idle tickets');
  } catch (error) { logger.error({ err: error }, 'autoCloseTickets failed'); }
}

export function startAutoCloseJob() {
  logger.info('Starting auto-close tickets job (daily)');
  autoCloseTickets();
  intervalId = setInterval(autoCloseTickets, ONE_DAY);
}

export function stopAutoCloseJob() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}
