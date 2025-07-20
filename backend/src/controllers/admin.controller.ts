import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { SubscriptionPlan } from '../models/SubscriptionPlan';

export class AdminController {
  private userRepository = AppDataSource.getRepository(User);
  private planRepository = AppDataSource.getRepository(SubscriptionPlan);

  // User management
  async getUsers(req: Request, res: Response) {
    const users = await this.userRepository.find();
    res.json(users);
  }

  async createUser(req: Request, res: Response) {
    const { email, password, isAdmin } = req.body;
    const newUser = this.userRepository.create({ email, password, isAdmin });
    await this.userRepository.save(newUser);
    res.status(201).json(newUser);
  }

  // Subscription plan management
  async getPlans(req: Request, res: Response) {
    const plans = await this.planRepository.find();
    res.json(plans);
  }

  async createPlan(req: Request, res: Response) {
    const { name, price, emailCredits } = req.body;
    const newPlan = this.planRepository.create({ name, price, emailCredits });
    await this.planRepository.save(newPlan);
    res.status(201).json(newPlan);
  }

  async updatePlan(req: Request, res: Response) {
    const { id } = req.params;
    const { name, price, emailCredits } = req.body;
    const plan = await this.planRepository.findOneBy({ id });
    if (plan) {
      plan.name = name;
      plan.price = price;
      plan.emailCredits = emailCredits;
      await this.planRepository.save(plan);
      res.json(plan);
    } else {
      res.status(404).json({ message: 'Plan not found' });
    }
  }
}

export const adminController = new AdminController();