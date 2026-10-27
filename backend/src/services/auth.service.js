import { db } from '../prisma/db.ts';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.util.js';

export const authService = {
  /**
   * Authenticate user with email and password.
   */
  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await db.orm.public.User
      .include('institution')
      .where({ email: cleanEmail })
      .first();

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken(user);

    // Audit log for login
    try {
      await db.orm.public.AuditLog.create({
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
        details: `User '${user.name}' (${user.role}) logged in successfully.`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Login audit log notice:', e.message);
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        institution: user.institution
          ? {
              id: user.institution.id,
              name: user.institution.name,
              code: user.institution.code,
            }
          : null,
      },
    };
  },

  /**
   * Get current authenticated user profile.
   */
  async getMe(userId) {
    const user = await db.orm.public.User
      .include('institution')
      .where({ id: userId })
      .first();

    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
      institution: user.institution
        ? {
            id: user.institution.id,
            name: user.institution.name,
            code: user.institution.code,
          }
        : null,
      createdAt: user.createdAt,
    };
  },

  /**
   * List all users (ADMIN only).
   */
  async listUsers() {
    const users = await db.orm.public.User
      .include('institution')
      .all();

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      institutionId: u.institutionId,
      institution: u.institution
        ? {
            id: u.institution.id,
            name: u.institution.name,
            code: u.institution.code,
          }
        : null,
      createdAt: u.createdAt,
    }));
  },

  /**
   * Create a new user (ADMIN only).
   */
  async createUser({ email, password, name, role, institutionId }, actingUserId) {
    if (!email || !password || !name || !role) {
      const err = new Error('Name, email, password, and role are required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await db.orm.public.User.where({ email: cleanEmail }).first();
    if (existing) {
      const err = new Error(`User with email '${email}' already exists.`);
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await hashPassword(password);
    const parsedInstId = institutionId ? parseInt(institutionId, 10) : null;

    const created = await db.orm.public.User.create({
      email: cleanEmail,
      name: name.trim(),
      passwordHash: hashedPassword,
      role,
      institutionId: parsedInstId && !isNaN(parsedInstId) ? parsedInstId : null,
    });

    try {
      await db.orm.public.AuditLog.create({
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: created.id,
        userId: actingUserId || null,
        details: `User '${created.name}' (${created.email}, Role: ${created.role}) created.`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('AuditLog notice (User create):', e.message);
    }

    return this.getMe(created.id);
  },

  /**
   * Update user details/role/institution/password (ADMIN only).
   */
  async updateUser(id, { name, role, institutionId, password }, actingUserId) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid user ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.User.where({ id: parsedId }).first();
    if (!existing) {
      const err = new Error(`User with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (role !== undefined) updatePayload.role = role;
    if (institutionId !== undefined) {
      const pId = parseInt(institutionId, 10);
      updatePayload.institutionId = !isNaN(pId) ? pId : null;
    }
    if (password && password.trim()) {
      updatePayload.passwordHash = await hashPassword(password.trim());
    }

    await db.orm.public.User.where({ id: parsedId }).update(updatePayload);

    try {
      await db.orm.public.AuditLog.create({
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: parsedId,
        userId: actingUserId || null,
        details: `User #${parsedId} updated: ${Object.keys(updatePayload).join(', ')}.`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('AuditLog notice (User update):', e.message);
    }

    return this.getMe(parsedId);
  },

  /**
   * Seed / Ensure the 4 primary demo accounts exist in database without resetting anything.
   */
  async ensureDemoAccounts() {
    const demoAccounts = [
      {
        email: 'institution@aicte-india.org',
        name: 'Prof. Ramesh Rao (Registrar)',
        role: 'INSTITUTION_USER',
        institutionId: 1, // Delhi Technological Institute
        defaultPassword: 'password123',
      },
      {
        email: 'officer@aicte-india.org',
        name: 'Dr. Amit K. Sharma (Bureau Officer)',
        role: 'AICTE_OFFICER',
        institutionId: null,
        defaultPassword: 'password123',
      },
      {
        email: 'approver@aicte-india.org',
        name: 'Shri Vikram Malhotra (Approving Authority)',
        role: 'APPROVING_OFFICER',
        institutionId: null,
        defaultPassword: 'password123',
      },
      {
        email: 'admin@aicte-india.org',
        name: 'AICTE Portal Administrator',
        role: 'ADMIN',
        institutionId: null,
        defaultPassword: 'password123',
      },
    ];

    const results = [];

    for (const acc of demoAccounts) {
      const existing = await db.orm.public.User.where({ email: acc.email }).first();
      if (!existing) {
        const hashedPassword = await hashPassword(acc.defaultPassword);
        const created = await db.orm.public.User.create({
          email: acc.email,
          name: acc.name,
          passwordHash: hashedPassword,
          role: acc.role,
          institutionId: acc.institutionId,
        });
        results.push({ action: 'CREATED', email: created.email, role: created.role });
      } else {
        // Ensure valid bcrypt password hash is active
        const isBcrypt = existing.passwordHash && existing.passwordHash.startsWith('$2');
        if (!isBcrypt) {
          const freshHash = await hashPassword(acc.defaultPassword);
          await db.orm.public.User.where({ id: existing.id }).update({
            passwordHash: freshHash,
            name: acc.name,
            role: acc.role,
          });
          results.push({ action: 'UPDATED_HASH', email: existing.email, role: acc.role });
        } else {
          results.push({ action: 'EXISTS', email: existing.email, role: existing.role });
        }
      }
    }

    return results;
  },
};
