import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const adminRouter = Router();

// All admin routes are protected
adminRouter.use(authMiddleware);

// User management
adminRouter.get('/users', adminController.getUsers.bind(adminController));
adminRouter.post('/users', adminController.createUser.bind(adminController));

// Subscription plan management
adminRouter.get('/plans', adminController.getPlans.bind(adminController));
adminRouter.post('/plans', adminController.createPlan.bind(adminController));
adminRouter.put('/plans/:id', adminController.updatePlan.bind(adminController));

export default adminRouter;