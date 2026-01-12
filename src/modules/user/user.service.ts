import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/data-source";
import { user } from "../../db/schema/users";
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from "../../utils/errors";
import {
  UpdateUserInputType,
  UpdatePasswordInputType,
  ListUsersQueryType,
} from "./dto/user.dto";
import { hashPassword, comparePassword } from "../auth/auth.service";

export class UserService {
  /**
   * Get all users with pagination and optional filtering
   */
  async findAll(query: ListUsersQueryType) {
    const { page = 1, limit = 10, role, search } = query;
    const offset = (page - 1) * limit;

    const whereClause: any[] = [];

    // Filter by role if provided
    if (role) {
      whereClause.push(eq(user.role, role));
    }

    // Search by name or email if provided
    if (search) {
      whereClause.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    // Get users
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        matriculeFiscale: user.matriculeFiscale,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause.length ? and(...whereClause) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(user.createdAt);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user)
      .where(whereClause.length ? and(...whereClause) : undefined);

    return {
      page,
      limit,
      total: Number(count),
      data: users,
    };
  }

  /**
   * Get user by ID
   */
  async findById(id: string) {
    const [existingUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        matriculeFiscale: user.matriculeFiscale,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    return existingUser;
  }

  /**
   * Update user profile
   * requesterId: ID of user making the request (from JWT)
   * targetId: ID of user being updated
   */
  async update(
    requesterId: string,
    requesterRole: string,
    targetId: string,
    data: UpdateUserInputType
  ) {
    // Verify target user exists
    const targetUser = await this.findById(targetId);

    // Authorization check: User can update own profile OR admin can update any profile
    const isOwnProfile = requesterId === targetId;
    const isAdmin = requesterRole === "admin";

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenError(
        "You are not authorized to update this user's profile"
      );
    }

    // Only admins can change user roles
    if (data.role && !isAdmin) {
      throw new ForbiddenError("Only administrators can change user roles");
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== targetUser.email) {
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.email, data.email))
        .limit(1);

      if (existingUser) {
        throw new ConflictError("Email is already taken");
      }
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.matriculeFiscale !== undefined)
      updatePayload.matriculeFiscale = data.matriculeFiscale;
    if (data.role !== undefined) updatePayload.role = data.role;

    // If no fields to update, return current user
    if (Object.keys(updatePayload).length === 0) {
      return targetUser;
    }

    // Update user
    const [updated] = await db
      .update(user)
      .set(updatePayload)
      .where(eq(user.id, targetId))
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

    return updated;
  }

  /**
   * Update user password
   */
  async updatePassword(
    requesterId: string,
    requesterRole: string,
    targetId: string,
    data: UpdatePasswordInputType
  ) {
    // Authorization check: User can update own password OR admin can update any password
    const isOwnProfile = requesterId === targetId;
    const isAdmin = requesterRole === "admin";

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenError(
        "You are not authorized to update this user's password"
      );
    }

    // Get user with password for verification
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, targetId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // Verify current password (only if user is updating own password)
    if (isOwnProfile) {
      const isPasswordValid = await comparePassword(
        data.currentPassword,
        targetUser.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError("Current password is incorrect");
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await db
      .update(user)
      .set({ password: hashedPassword })
      .where(eq(user.id, targetId));

    return { message: "Password updated successfully" };
  }

  /**
   * Delete user (admin only)
   */
  async delete(id: string) {
    // Verify user exists
    await this.findById(id);

    // Delete user
    const [deleted] = await db
      .delete(user)
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
      });

    return deleted;
  }

  /**
   * Get all clients (customers and business-customers) with pagination
   */
  async findClients(query: ListUsersQueryType) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;

    const whereClause: any[] = [
      or(
        eq(user.role, "customer"),
        eq(user.role, "business-customer")
      )
    ];

    // Search by name or email if provided
    if (search) {
      whereClause.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    // Get clients
    const clients = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        matriculeFiscale: user.matriculeFiscale,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(...whereClause))
      .limit(limit)
      .offset(offset)
      .orderBy(user.createdAt);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user)
      .where(and(...whereClause));

    return {
      page,
      limit,
      total: Number(count),
      data: clients,
    };
  }

  /**
   * Get all staff (admins and support) with pagination
   */
  async findStaff(query: ListUsersQueryType) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;

    const whereClause: any[] = [
      or(
        eq(user.role, "admin"),
        eq(user.role, "support")
      )
    ];

    // Search by name or email if provided
    if (search) {
      whereClause.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    // Get staff
    const staff = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        matriculeFiscale: user.matriculeFiscale,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(...whereClause))
      .limit(limit)
      .offset(offset)
      .orderBy(user.createdAt);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user)
      .where(and(...whereClause));

    return {
      page,
      limit,
      total: Number(count),
      data: staff,
    };
  }
}
