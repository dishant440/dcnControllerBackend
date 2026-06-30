import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../modules/user/user.model';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Not Authorized: No Token Provided',
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123!');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not Authorized: Invalid Token',
    });
    return;
  }
};

/**
 * RBAC / Policy Access Control Middleware
 */
export const CheckPolicyAccess = (page: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const decodedUser = req.user;
      if (!decodedUser || !decodedUser.id) {
        res.status(401).json({
          success: false,
          message: 'Not Authorized: User Session Missing',
        });
        return;
      }

      // 1. Admin Bypass
      if (decodedUser.isAdmin) {
        next();
        return;
      }

      // 2. Fetch User and Populate Policy details
      const user = await User.findById(decodedUser.id).populate('policy');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // 3. Check direct customPermissions overrides first
      if (user.customPermissions && Array.isArray(user.customPermissions)) {
        const customPagePerm = user.customPermissions.find((p) => p.page === page);
        if (customPagePerm) {
          const actionPerm = customPagePerm.actions.find((a) => a.action === action);
          if (actionPerm) {
            if (actionPerm.access === 'allowed') {
              next();
              return;
            } else {
              res.status(403).json({
                success: false,
                message: 'Action Denied: Not Authorized (Custom Restriction)',
              });
              return;
            }
          }
        }
      }

      // 4. Check Global Policy
      const policy: any = user.policy;
      if (!policy || !policy.permissions) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: No Active Policy Assigned',
        });
        return;
      }

      const pagePermission = policy.permissions.find((p: any) => p.page === page);
      if (!pagePermission) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: Not Authorized',
        });
        return;
      }

      const actionPermission = pagePermission.actions.find((a: any) => a.action === action);
      if (!actionPermission || actionPermission.access !== 'allowed') {
        res.status(403).json({
          success: false,
          message: 'Action Denied: Not Authorized',
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Authorization Error',
        error: error?.message || error,
      });
    }
  };
};
