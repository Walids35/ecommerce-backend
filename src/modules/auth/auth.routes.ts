import express from 'express';
import { login, signOut, verifyTokenization } from './auth.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = express.Router();
router.post('/login', asyncHandler(login));
router.post('/signout', asyncHandler(signOut));
router.get('/verify-token', asyncHandler(verifyTokenization));

export default router;