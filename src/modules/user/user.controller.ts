import { Request, Response, NextFunction } from 'express';
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
   * @desc    Create new user
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
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
