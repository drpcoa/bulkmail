import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';

export const authRouter = Router();

const validateRegister = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

authRouter.post('/register', validateRegister, authController.register.bind(authController));
authRouter.post('/login', validateLogin, authController.login.bind(authController));

export default authRouter;