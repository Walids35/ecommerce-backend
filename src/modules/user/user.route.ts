import { Router } from "express";
import { UserController } from "./user.controller";
import { verifyJWT, requireAdmin } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
const controller = new UserController();

// All user routes require authentication
router.use(verifyJWT);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Authenticated users
 */
router.get("/me", asyncHandler(controller.getCurrentUser.bind(controller)));

/**
 * @route   GET /api/users/clients
 * @desc    Get all clients (customers and business-customers)
 * @access  Admin only
 */
router.get("/clients", requireAdmin, asyncHandler(controller.getClients.bind(controller)));

/**
 * @route   GET /api/users/staff
 * @desc    Get all staff (admins and support)
 * @access  Admin only
 */
router.get("/staff", requireAdmin, asyncHandler(controller.getStaff.bind(controller)));

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination and filters)
 * @access  Admin only
 */
router.get("/", requireAdmin, asyncHandler(controller.findAll.bind(controller)));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only (users can use /me for their own profile)
 */
router.get("/:id", requireAdmin, asyncHandler(controller.findById.bind(controller)));

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Own profile or Admin
 */
router.put("/:id", asyncHandler(controller.update.bind(controller)));

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password
 * @access  Own profile or Admin
 */
router.put("/:id/password", asyncHandler(controller.updatePassword.bind(controller)));

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Admin only
 */
router.delete("/:id", requireAdmin, asyncHandler(controller.delete.bind(controller)));

export default router;
