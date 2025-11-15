import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Response, Request, CookieOptions } from "express";

dotenv.config();

export function signToken(payload: any) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (!secret || !expiresIn) {
    throw new Error("JWT_SECRET and JWT_EXPIRES_IN must be provided");
  }
  const options: jwt.SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, secret as jwt.Secret, options);
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
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
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