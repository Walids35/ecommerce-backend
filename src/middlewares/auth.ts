import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/errors";

// Interface for our request with user info
interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
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
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };

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
