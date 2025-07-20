import { User } from '../models/User';
import { AppDataSource } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(userData: Partial<User>): Promise<User> {
    const { email, password } = userData;
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({ ...userData, password: hashedPassword });
    return this.userRepository.save(newUser);
  }

  async login(email: string, pass: string): Promise<{ user: User; token: string } | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return { user, token };
  }
}

export const authService = new AuthService();