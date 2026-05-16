import { Router } from 'express';
import { AdminSupportController } from '../../controllers/admin/support.controller';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();
router.get('/tickets', AdminSupportController.listTickets);
router.get('/tickets/:id', AdminSupportController.getTicket);
router.patch('/tickets/:id', AdminSupportController.updateTicket);
router.post('/tickets/:id/reply', auditLogger('TICKET_REPLIED'), AdminSupportController.reply);
router.post('/tickets/:id/note', AdminSupportController.addNote);
router.post('/tickets/:id/close', AdminSupportController.closeTicket);
router.get('/metrics', AdminSupportController.getMetrics);
router.get('/canned-responses', AdminSupportController.listCannedResponses);
router.post('/canned-responses', AdminSupportController.createCannedResponse);
router.patch('/canned-responses/:id', AdminSupportController.updateCannedResponse);
router.delete('/canned-responses/:id', AdminSupportController.deleteCannedResponse);

export default router;
