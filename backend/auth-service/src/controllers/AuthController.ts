import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { Result } from '../../../shared/utils/Result';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json(Result.fail('User already exists'));
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = User.create({
        email,
        passwordHash,
        firstName,
        lastName,
        role: UserRole.USER
      });

      await user.save();
      return res.status(201).json(Result.ok({ id: user.id, email: user.email }));
    } catch (error) {
      return res.status(500).json(Result.fail('Internal server error'));
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await User.createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email })
        .getOne();

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json(Result.fail('Invalid credentials'));
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, tenantId: user.tenantId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      return res.json(Result.ok({ token }));
    } catch (error) {
      return res.status(500).json(Result.fail('Internal server error'));
    }
  }
}
