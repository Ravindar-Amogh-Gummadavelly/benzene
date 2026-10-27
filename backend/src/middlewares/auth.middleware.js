import { verifyToken } from '../utils/auth.util.js';
import { db } from '../prisma/db.ts';

/**
 * Middleware: Verify that the request includes a valid Bearer JWT.
 * Attaches decoded user record to `req.user`.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired authentication session. Please log in again.',
      });
    }

    // Load fresh user data from database including institution relation
    const user = await db.orm.public.User
      .include('institution')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User account associated with this session no longer exists.',
      });
    }

    // Attach to request
    req.user = {
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
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication verification.',
    });
  }
}

/**
 * Middleware: Require one of the specified roles.
 * E.g., authorize('ADMIN', 'AICTE_OFFICER')
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required before authorization check.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden. Your role (${req.user.role}) does not have permission to perform this action.`,
      });
    }

    next();
  };
}

/**
 * Middleware / Helper: Server-side Institution Scoping.
 * Ensures an INSTITUTION_USER can only view/mutate records belonging to their own institutionId.
 * Non-institution users (AICTE_OFFICER, APPROVING_OFFICER, ADMIN) are unconstrained.
 */
export function enforceInstitutionScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required for scoping check.',
    });
  }

  if (req.user.role === 'INSTITUTION_USER') {
    if (!req.user.institutionId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. Your user account is not linked to any registered institution.',
      });
    }

    // Override or force institutionId filter in queries and payloads
    req.scopedInstitutionId = req.user.institutionId;

    if (req.query) {
      req.query.institutionId = String(req.user.institutionId);
    }
  }

  next();
}
