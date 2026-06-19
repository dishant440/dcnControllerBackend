import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from './user.service';

export class UserController {
  /**
   * @desc    Get all users
   * @route   GET /api/users
   * @access  Public
   */
  public static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Create new user / Register
   * @route   POST /api/users
   * @access  Public
   */
  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      
      const userExists = await UserService.getUserByEmail(email);
      if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
      }

      const user = await UserService.createUser({ name, email, password });

      res.status(201).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @desc    Login user
   * @route   POST /api/users/login
   * @access  Public
   */
  public static async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
      }

      const user = await UserService.getUserByEmail(email);
      if (!user || !(await user.comparePassword(password))) {
        res.status(401);
        throw new Error('Invalid email or password');
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'supersecretjwtkey123!',
        { expiresIn: '30d' }
      );

      res.status(200).json({
        success: true,
        token,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
