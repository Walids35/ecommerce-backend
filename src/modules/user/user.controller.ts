import { Response } from "express";
import { UserService } from "./user.service";
import {
  UpdateUserSchema,
  UpdatePasswordSchema,
  ListUsersQuerySchema,
} from "./dto/user.dto";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

const service = new UserService();

export class UserController {
  /**
   * GET /api/users - Get all users (admin only)
   */
  async findAll(req: AuthRequest, res: Response) {
    const parsed = ListUsersQuerySchema.parse(req.query);
    const result = await service.findAll(parsed);

    sendPaginated(
      res,
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Users retrieved successfully"
    );
  }

  /**
   * GET /api/users/me - Get current user profile
   */
  async getCurrentUser(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const user = await service.findById(userId);
    sendSuccess(res, user, "User profile retrieved successfully");
  }

  /**
   * GET /api/users/:id - Get user by ID
   */
  async findById(req: AuthRequest, res: Response) {
    const user = await service.findById(req.params.id);
    sendSuccess(res, user, "User retrieved successfully");
  }

  /**
   * PUT /api/users/:id - Update user profile
   */
  async update(req: AuthRequest, res: Response) {
    const parsed = UpdateUserSchema.parse(req.body);
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const targetId = req.params.id;

    const updated = await service.update(
      requesterId,
      requesterRole,
      targetId,
      parsed
    );

    sendSuccess(res, updated, "User updated successfully");
  }

  /**
   * PUT /api/users/:id/password - Update user password
   */
  async updatePassword(req: AuthRequest, res: Response) {
    const parsed = UpdatePasswordSchema.parse(req.body);
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const targetId = req.params.id;

    const result = await service.updatePassword(
      requesterId,
      requesterRole,
      targetId,
      parsed
    );

    sendSuccess(res, result, result.message);
  }

  /**
   * DELETE /api/users/:id - Delete user (admin only)
   */
  async delete(req: AuthRequest, res: Response) {
    const deleted = await service.delete(req.params.id);
    sendSuccess(res, deleted, "User deleted successfully");
  }

  /**
   * GET /api/users/clients - Get all clients (customers and business-customers)
   */
  async getClients(req: AuthRequest, res: Response) {
    const parsed = ListUsersQuerySchema.parse(req.query);
    const result = await service.findClients(parsed);

    sendPaginated(
      res,
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Clients retrieved successfully"
    );
  }

  /**
   * GET /api/users/staff - Get all staff (admins and support)
   */
  async getStaff(req: AuthRequest, res: Response) {
    const parsed = ListUsersQuerySchema.parse(req.query);
    const result = await service.findStaff(parsed);

    sendPaginated(
      res,
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Staff retrieved successfully"
    );
  }
}
