import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./dto/auth.dto";
import { authenticateUser, createUser } from "./auth.service";
import { cookies, signToken, verifyToken } from "./jwt.utils";
import { sendSuccess } from "../../utils/response";
import { UnauthorizedError, ValidationError } from "../../utils/errors";

export const login = async (req: Request, res: Response) => {
  const validationResult = await loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new ValidationError(
      "Validation failed",
      validationResult.error.issues
    );
  }

  const { email, password } = validationResult.data;

  const user = await authenticateUser({ email, password });

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  cookies.set(res, "token", token);

  sendSuccess(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    "User signed in successfully"
  );
};

export const signOut = async (req: Request, res: Response) => {
  cookies.clear(res, "token");
  sendSuccess(res, null, "User signed out successfully");
};

export const register = async (req: Request, res: Response) => {
  const validationResult = await registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new ValidationError(
      "Validation failed",
      validationResult.error.issues
    );
  }

  const { name, email, password, address, phone, matriculeFiscale } =
    validationResult.data;

  const user = await createUser({
    name,
    email,
    password,
    address,
    phone,
    matriculeFiscale,
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  cookies.set(res, "token", token);

  sendSuccess(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        matriculeFiscale: user.matriculeFiscale,
      },
    },
    "User registered successfully"
  );
};

export const verifyTokenization = async (req: Request, res: Response) => {
  const token = cookies.get(req, "token");

  if (!token) {
    throw new UnauthorizedError("No token provided");
  }

  const decoded = verifyToken(token) as {
    id: string;
    email: string;
    role: string;
    name: string;
  };

  if (!decoded || !decoded.id || !decoded.email) {
    throw new UnauthorizedError("Invalid token payload");
  }

  sendSuccess(
    res,
    {
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      },
    },
    "Token is valid"
  );
};
