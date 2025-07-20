import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.post('/webhook', analyticsController.handleWebhook.bind(analyticsController));

export default analyticsRouter;