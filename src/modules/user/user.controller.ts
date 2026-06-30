import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from './user.model';
import { AccessPermission } from './accessPermission.model';

export class UserController {
  /**
   * @desc    Create new user / Register (Legacy: addNewUser)
   * @route   POST /api/addNewUser
   * @access  Private (Admin/User with user permission)
   */
  public static async addNewUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        Name,
        EmployeeId,
        designation,
        phoneNo,
        email,
        password,
        isAdmin,
        policy,
        customPermissions
      } = req.body;

      if (!Name || !EmployeeId || !designation || !phoneNo || !email || !password || isAdmin === undefined) {
        res.status(400).json({ message: 'Missing required user fields' });
        return;
      }

      // Check for duplicates
      const userExist = await User.findOne({
        $or: [{ phoneNo }, { email }, { EmployeeId }]
      });

      if (userExist) {
        if (userExist.phoneNo === phoneNo) {
          res.status(400).json({ message: 'Phone number already exists' });
          return;
        }
        if (userExist.email === email) {
          res.status(400).json({ message: 'Email already exists' });
          return;
        }
        if (userExist.EmployeeId === EmployeeId) {
          res.status(400).json({ message: 'Employee ID already exists' });
          return;
        }
      }

      const newUserData: any = {
        Name,
        EmployeeId,
        designation,
        phoneNo,
        email,
        password, // Pre-save hook in user.model.ts handles bcrypt hashing
        isAdmin
      };

      // Automatically assign ADMIN POLICY to admins
      if (isAdmin) {
        const adminPolicy = await AccessPermission.findOne({ policyName: 'ADMIN ACCESS POLICY' });
        if (!adminPolicy) {
          res.status(500).json({ message: 'ADMIN POLICY not found in DB' });
          return;
        }
        newUserData.policy = adminPolicy._id;
      } else {
        if (policy) {
          const foundPolicy = await AccessPermission.findById(policy);
          if (!foundPolicy) {
            res.status(400).json({ message: 'Invalid policy ID' });
            return;
          }
          newUserData.policy = policy;
        }

        if (customPermissions && Array.isArray(customPermissions)) {
          newUserData.customPermissions = customPermissions;
        }
      }

      const newUser = new User(newUserData);
      await newUser.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        userId: newUser._id
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @desc    User Sign In
   * @route   POST /api/signin
   * @access  Public
   */
  public static async SignIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userName, password } = req.body;

      if (!userName || !password) {
        res.status(400).json({ message: 'Invalid input' });
        return;
      }

      const userExist = await User.findOne({ email: userName });

      if (!userExist) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const isPasswordCorrect = await userExist.comparePassword(password);
      if (!isPasswordCorrect) {
        res.status(401).json({ message: 'Incorrect credentials' });
        return;
      }

      const userPolicy = userExist.policy || 'no-access';

      const token = jwt.sign(
        {
          id: userExist._id,
          email: userExist.email,
          policy: userPolicy,
          designation: userExist.designation,
          isAdmin: userExist.isAdmin
        },
        process.env.JWT_SECRET || 'supersecretjwtkey123!',
        { expiresIn: '5h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: userExist._id,
          email: userExist.email,
          name: userExist.Name,
          role: userExist.designation,
          policy: userExist.policy
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @desc    Get all users
   * @route   GET /api/getAllUser
   * @access  Private (Admin/User with user permission)
   */
  public static async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find({});
      if (!users.length) {
        res.status(200).json({ message: 'No User Found', users: [] });
        return;
      }
      res.status(200).json({ users });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @desc    Delete user
   * @route   DELETE /api/deleteUser/:id
   * @access  Private (Admin/User with user permission)
   */
  public static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @desc    Edit user details
   * @route   PUT /api/editUser/:id
   * @access  Private (Admin/User with user permission)
   */
  public static async editUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { Name, EmployeeId, designation, phoneNo, email, password, isAdmin, policy } = req.body;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      user.Name = Name || user.Name;
      user.EmployeeId = EmployeeId || user.EmployeeId;
      user.designation = designation || user.designation;
      user.phoneNo = phoneNo || user.phoneNo;
      user.email = email || user.email;
      user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
      user.policy = policy !== undefined ? policy : user.policy;

      if (password) {
        user.password = password; // Pre-save hook hashes this password since isModified('password') will be true
      }

      await user.save();
      res.status(200).json({ message: 'User updated successfully', user });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @desc    Get user suggestions matching regex
   * @route   GET /api/getUserSuggestion
   * @access  Private
   */
  public static async findUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Invalid Input' });
        return;
      }

      const newRegex = new RegExp('^' + query, 'i');
      const suggestions = await User.find({
        $or: [
          { Name: { $regex: newRegex } },
          { EmployeeId: { $regex: newRegex } },
          { phoneNo: { $regex: newRegex } },
          { email: { $regex: newRegex } },
          { designation: { $regex: newRegex } }
        ]
      }).limit(10);

      res.status(200).json({ suggestions });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @desc    Update a user's assigned policy and custom overrides
   * @route   PUT /api/updatePolicy/:userId
   * @access  Private (Admin/User with user policy permission)
   */
  public static async updateUserPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { policyId, customPermissions } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const updateFields: any = {};

      if (policyId) {
        const policyExists = await AccessPermission.findById(policyId);
        if (!policyExists) {
          res.status(400).json({
            success: false,
            message: 'Policy not found',
          });
          return;
        }
        updateFields.policy = policyId;
      }

      if (customPermissions && Array.isArray(customPermissions)) {
        updateFields.customPermissions = customPermissions;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateFields,
        { new: true }
      ).populate('policy');

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User policy updated successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Pre-existing controller API wrappers for internal backwards compatibility
  public static getUsers = UserController.getUser;
  public static createUser = UserController.addNewUser;
  public static loginUser = UserController.SignIn;
}
