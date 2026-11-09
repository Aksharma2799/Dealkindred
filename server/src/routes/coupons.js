import { Router } from "express";
import { z } from "zod";
import { db } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const publicSelect = `SELECT c.id,c.title,c.brand,c.description,c.terms,c.category,c.discount,c.starts_at AS startsAt,
 c.expires_at AS expiresAt,c.quantity,
 (c.quantity - (SELECT COUNT(*) FROM claims cl WHERE cl.coupon_id=c.id)) AS remaining,
 u.name AS ownerName
 FROM coupons c JOIN users u ON u.id=c.owner_id`;

router.get("/", (req, res) => {
  const search = String(req.query.search || "").trim();
  const rows = db
    .prepare(
      `${publicSelect}
    WHERE c.starts_at <= ? AND c.expires_at >= ?
    AND c.quantity > (SELECT COUNT(*) FROM claims cl WHERE cl.coupon_id=c.id)
    AND (c.title LIKE ? OR c.brand LIKE ? OR c.category LIKE ?)
    ORDER BY c.expires_at ASC`,
    )
    .all(
      new Date().toISOString(),
      new Date().toISOString(),
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    );
  res.json({ coupons: rows });
});

router.post("/", requireAuth, (req, res) => {
  const schema = z.object({
    title: z.string().trim().min(4).max(90),
    brand: z.string().trim().min(2).max(60),
    code: z.string().trim().min(3).max(40),
    description: z.string().trim().min(10).max(500),
    terms: z.string().max(500).optional().default(""),
    category: z.string().min(2).max(40),
    discount: z.string().trim().min(2).max(30),
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    quantity: z.coerce.number().int().min(1).max(10000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (new Date(d.expiresAt) <= new Date(d.startsAt))
    return res
      .status(400)
      .json({ error: "Expiry must be after the start date." });
  const result = db
    .prepare(
      `INSERT INTO coupons
    (owner_id,title,brand,code,description,terms,category,discount,starts_at,expires_at,quantity)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      req.user.id,
      d.title,
      d.brand,
      d.code,
      d.description,
      d.terms,
      d.category,
      d.discount,
      d.startsAt,
      d.expiresAt,
      d.quantity,
    );
  res.status(201).json({
    id: Number(result.lastInsertRowid),
    message: "Your coupon is live.",
  });
});

router.get("/mine", requireAuth, (req, res) => {
  const coupons = db
    .prepare(`${publicSelect} WHERE c.owner_id=? ORDER BY c.created_at DESC`)
    .all(req.user.id);
  res.json({ coupons });
});

router.get("/:id/claims", requireAuth, (req, res) => {
  const coupon = db
    .prepare("SELECT id,title,owner_id FROM coupons WHERE id=?")
    .get(req.params.id);
  if (!coupon) return res.status(404).json({ error: "Coupon not found." });
  if (coupon.owner_id !== req.user.id)
    return res
      .status(403)
      .json({ error: "Only the coupon owner can view claimants." });
  const claims = db
    .prepare(
      `SELECT cl.id,cl.claim_code AS claimCode,cl.status,cl.claimed_at AS claimedAt,
    cl.redeemed_at AS redeemedAt,u.name AS userName,u.email AS userEmail
    FROM claims cl JOIN users u ON u.id=cl.user_id WHERE cl.coupon_id=? ORDER BY cl.claimed_at DESC`,
    )
    .all(coupon.id);
  res.json({ coupon, claims });
});
export default router;
