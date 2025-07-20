import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      if (result) {
        res.status(200).json({ success: true, data: result });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();