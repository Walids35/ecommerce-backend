import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Interface for our request with user info
interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get JWT from HttpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "your_jwt_secret";
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };

    // Attach user info to request object
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
