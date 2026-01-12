import express from "express";
import {
  login,
  loginStaff,
  loginClient,
  signOut,
  verifyTokenization,
  register,
} from "./auth.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = express.Router();
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login)); // Generic login (accepts all roles)
router.post("/login-staff", asyncHandler(loginStaff)); // Staff only (admin & support)
router.post("/login-client", asyncHandler(loginClient)); // Client only (customer & business-customer)
router.post("/signout", asyncHandler(signOut));
router.get("/verify-token", asyncHandler(verifyTokenization));

export default router;
