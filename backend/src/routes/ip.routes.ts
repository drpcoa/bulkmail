import { Router } from 'express';
import { ipController } from '../controllers/ip.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const ipRouter = Router();

ipRouter.use(authMiddleware);

ipRouter.get('/check/:ip', ipController.checkIp.bind(ipController));

export default ipRouter;