import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 * RBAC / Policy Bypass Middleware
 */
export const CheckPolicyAccess = (page: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Bypassed completely as requested
    next();
  };
};
