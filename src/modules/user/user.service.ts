import { User, IUser } from './user.model';

export class UserService {
  /**
   * Fetch all users from the database
   */
  public static async getAllUsers(): Promise<IUser[]> {
    return await User.find();
  }

  /**
   * Find a user by email
   */
  public static async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  /**
   * Create a new user in the database
   */
  public static async createUser(userData: Partial<IUser>): Promise<IUser> {
    return await User.create(userData);
  }
}
