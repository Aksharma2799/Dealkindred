import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({ email: z.string().email().max(180), password: z.string().min(8).max(100) });
const tokenFor = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'local-development-secret', { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const parsed = z.object({ name: z.string().trim().min(2).max(60), email: z.string().email().max(180), password: z.string().min(8).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { name, email, password } = parsed.data;
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())) return res.status(409).json({ error: 'An account with this email already exists.' });
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(name, email.toLowerCase(), hash);
    const user = { id: Number(result.lastInsertRowid), name, email: email.toLowerCase() };
    res.status(201).json({ token: tokenFor(user), user });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password (at least 8 characters).' });
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email.toLowerCase());
    if (!userRow || !(await bcrypt.compare(parsed.data.password, userRow.password_hash))) return res.status(401).json({ error: 'Incorrect email or password.' });
    const user = { id: userRow.id, name: userRow.name, email: userRow.email };
    res.json({ token: tokenFor(user), user });
  } catch (err) { next(err); }
});
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
export default router;
