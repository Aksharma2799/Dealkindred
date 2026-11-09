import { Router } from "express";
import { db } from "../db/database.js";
const router = Router();
router.get("/affiliate", (req, res) => {
  const offers = db
    .prepare(
      "SELECT id,title,partner,description,offer,url,category FROM affiliate_offers ORDER BY id DESC",
    )
    .all();
  res.json({ offers });
});
router.get("/cards", (req, res) => {
  const cards = db
    .prepare(
      "SELECT id,bank,card_name AS cardName,merchant,offer,category FROM card_offers ORDER BY id DESC",
    )
    .all();
  res.json({ cards });
});
export default router;
