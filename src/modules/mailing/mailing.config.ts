import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

if (!process.env.RESEND_FROM_EMAIL) {
  throw new Error('RESEND_FROM_EMAIL environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const MAILING_CONFIG = {
  fromEmail: process.env.RESEND_FROM_EMAIL,
  fromName: process.env.RESEND_FROM_NAME || 'E-Commerce Store',
  replyTo: process.env.RESEND_REPLY_TO || process.env.RESEND_FROM_EMAIL,
} as const;
