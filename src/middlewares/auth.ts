import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

// Interface for our request with user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "admin" | "support" | "customer" | "business-customer";
    name: string;
  };
}

export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get JWT from HttpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      throw new UnauthorizedError("Token missing");
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "your_jwt_secret";
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: "admin" | "support" | "customer" | "business-customer";
      name: string;
    };

    // Attach user info to request object
    req.user = decoded;

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return next(err);
    }
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

/**
 * Middleware factory to require specific roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        throw new UnauthorizedError("User role not found in token");
      }

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * Convenience middleware for admin and support staff
 */
export const requireStaff = requireRole(["admin", "support"]);

/**
 * Convenience middleware for authenticated customers
 */
export const requireCustomer = requireRole(["customer", "business-customer"]);

/**
 * Optional authentication - attaches user if token exists, doesn't reject if missing
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET || "your_jwt_secret";
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: "admin" | "support" | "customer" | "business-customer";
      name: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    // Invalid token is fine - continue without user
    next();
  }
};
