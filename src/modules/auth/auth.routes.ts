import express from 'express';
import { login, signOut, verifyTokenization } from './auth.controller';

const router = express.Router();
router.post('/login', login);
router.post('/signout', signOut);
router.get('/verify-token', verifyTokenization);

export default router;