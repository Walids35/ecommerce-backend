import { Request, Response, NextFunction } from "express";
import { loginSchema } from "./dto/login.dto";
import { formatValidationError } from "../../utils/format";
import { authenticateUser } from "./auth.service";
import { cookies, signToken } from "./jwt.utils";

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