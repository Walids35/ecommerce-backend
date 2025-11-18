import { Request, Response, NextFunction } from "express";
import { loginSchema } from "./dto/login.dto";
import { formatValidationError } from "../../utils/format";
import { authenticateUser } from "./auth.service";
import { cookies, signToken, verifyToken } from "./jwt.utils";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validationResult = await loginSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error),
            });
        }

        const { email, password } = validationResult.data;

        const user = await authenticateUser({ email, password });

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        });

        cookies.set(res, 'token', token);

        res.status(200).json({
            message: 'User signed in successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (e) {
        next(e);
        throw new Error('Internal server error');
    }
};

export const signOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    cookies.clear(res, 'token');
    res.status(200).json({
      message: 'User signed out successfully',
    });
  } catch (e) {
    res.status(500).json({
      error: 'Internal server error',
    });
    next(e);
  }
};

export const verifyTokenization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = cookies.get(req, 'token');

        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided',
            });
        }

        const decoded = verifyToken(token) as {
            id: string;
            email: string;
            role: string;
            name: string;
        };

        if (!decoded || !decoded.id || !decoded.email) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token payload',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name,
            },
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            error: 'Access denied',
            message: 'Invalid or expired token',
        });
    }
};