import { eq } from "drizzle-orm";
import { db } from "../../db/data-source";
import { user } from "../../db/schema/users";
import bcrypt from "bcrypt";
import {
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  InternalServerError,
} from "../../utils/errors";

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    throw new InternalServerError("Error hashing password");
  }
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    throw new InternalServerError("Error comparing password");
  }
};

export const createUser = async ({
  name,
  email,
  password,
  address,
  phone,
  matriculeFiscale,
  role = "customer",
}: {
  name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  matriculeFiscale?: string;
  role?: "admin" | "support" | "customer" | "business-customer";
}) => {
  try {
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0)
      throw new ConflictError("User with this email already exists");

    const password_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(user)
      .values({
        name,
        email,
        password: password_hash,
        role,
        address,
        phone,
        matriculeFiscale,
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        matriculeFiscale: user.matriculeFiscale,
        createdAt: user.createdAt,
      });

    return newUser;
  } catch (e) {
    throw e;
  }
};

export const authenticateUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      createdAt: existingUser.createdAt,
    };
  } catch (e) {
    throw e;
  }
};
