import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Response, Request, CookieOptions } from "express";

dotenv.config();

export function signToken(payload: any) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be provided");
  }
  return jwt.sign(payload, secret as jwt.Secret, { expiresIn: '30d' });
}

export function signPermenantToken(payload: any) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be provided");
  }
  return jwt.sign(payload, secret as jwt.Secret);
}

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be provided");
  }
  return jwt.verify(token, secret as jwt.Secret);
}

export const cookies = {
  getOptions: (): CookieOptions => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  }),

  set: (res: Response, name: string, value: string, options: CookieOptions = {}): void => {
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },

  clear: (res: Response, name: string, options: CookieOptions = {}): void => {
    res.clearCookie(name, { ...cookies.getOptions(), ...options });
  },

  get: (req: Request, name: string): string | undefined => {
    return req.cookies[name];
  },
};