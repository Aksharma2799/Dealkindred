import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

/**
 * Middleware to authenticate requests using JSON Web Tokens (JWT).
 * Verifies the token from the Authorization header, fetches the user from the database,
 * and attaches the user object to the request.
 */
export function requireAuth(req, res, next) {
  // 1. Extract the token from the Authorization header (Expects: "Bearer <token>")
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // 2. Reject the request if no token is provided
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  try {
    // 3. Verify the token using the secret key (falls back to a local dev secret if not set)
    const secret = process.env.JWT_SECRET || 'local-development-secret';
    const payload = jwt.verify(token, secret);

    // 4. Query the database to ensure the user still exists
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    // 5. Attach user details to the request object and proceed to the next middleware/route
    req.user = user;
    next();
  } catch (error) {
    // 6. Handle token verification failures or database lookup issues
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}
