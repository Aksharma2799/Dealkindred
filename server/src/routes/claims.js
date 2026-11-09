import { Router } from "express";
import crypto from "node:crypto";
import { db } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/mine", requireAuth, (req, res) => {
  const claims = db
    .prepare(
      `SELECT cl.id,cl.claim_code AS claimCode,cl.status,cl.claimed_at AS claimedAt,
    cl.redeemed_at AS redeemedAt,c.title,c.brand,c.discount,c.expires_at AS expiresAt
    FROM claims cl JOIN coupons c ON c.id=cl.coupon_id WHERE cl.user_id=? ORDER BY cl.claimed_at DESC`,
    )
    .all(req.user.id);
  res.json({ claims });
});

router.post("/coupons/:id/claim", requireAuth, (req, res) => {
  const coupon = db
    .prepare("SELECT * FROM coupons WHERE id=?")
    .get(req.params.id);
  if (!coupon) return res.status(404).json({ error: "Coupon not found." });
  if (coupon.owner_id === req.user.id)
    return res.status(400).json({ error: "You cannot claim your own coupon." });
  const now = new Date();
  if (new Date(coupon.starts_at) > now || new Date(coupon.expires_at) < now)
    return res
      .status(400)
      .json({ error: "This coupon is not currently active." });
  const used = db
    .prepare("SELECT COUNT(*) AS n FROM claims WHERE coupon_id=?")
    .get(coupon.id).n;
  if (used >= coupon.quantity)
    return res
      .status(409)
      .json({ error: "Sorry, all available claims have been taken." });
  if (
    db
      .prepare("SELECT id FROM claims WHERE coupon_id=? AND user_id=?")
      .get(coupon.id, req.user.id)
  )
    return res
      .status(409)
      .json({ error: "You have already claimed this coupon." });
  const code = `DK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const result = db
    .prepare("INSERT INTO claims (coupon_id,user_id,claim_code) VALUES (?,?,?)")
    .run(coupon.id, req.user.id, code);
  res.status(201).json({
    id: Number(result.lastInsertRowid),
    claimCode: code,
    message: "Coupon claimed. Your claim code is ready.",
  });
});

router.post("/:id/redeem", requireAuth, (req, res) => {
  const claim = db
    .prepare(
      `SELECT cl.*,c.owner_id FROM claims cl JOIN coupons c ON c.id=cl.coupon_id WHERE cl.id=?`,
    )
    .get(req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim not found." });
  if (claim.owner_id !== req.user.id)
    return res.status(403).json({
      error: "Only the coupon owner can mark this claim as redeemed.",
    });
  if (claim.status === "redeemed")
    return res.status(409).json({ error: "This claim is already redeemed." });
  db.prepare(
    "UPDATE claims SET status='redeemed',redeemed_at=CURRENT_TIMESTAMP WHERE id=?",
  ).run(claim.id);
  res.json({ message: "Claim marked as redeemed." });
});
export default router;
