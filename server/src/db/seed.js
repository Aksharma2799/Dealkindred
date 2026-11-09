import bcrypt from "bcryptjs";
import { db } from "./database.js";

const seed = async () => {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) {
    console.log("Database already contains users; seed skipped.");
    process.exit(0);
  }
  const hash = await bcrypt.hash("DemoPass123!", 12);
  const insertUser = db.prepare(
    "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)",
  );
  const owner = insertUser.run(
    "Maya Sharma",
    "maya@dealkindred.demo",
    hash,
  ).lastInsertRowid;
  const member = insertUser.run(
    "Ashish Sharma",
    "ashish@dealkindred.demo",
    hash,
  ).lastInsertRowid;
  const now = new Date();
  const future = (days) =>
    new Date(now.getTime() + days * 86400000).toISOString();
  const past = (days) =>
    new Date(now.getTime() - days * 86400000).toISOString();
  const insertCoupon = db.prepare(`INSERT INTO coupons
    (owner_id,title,brand,code,description,terms,category,discount,starts_at,expires_at,quantity)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const c1 = insertCoupon.run(
    owner,
    "Everyday essentials deal",
    "FreshCart",
    "FRESH20",
    "Save on pantry staples and everyday household essentials.",
    "Minimum order ₹499. One use per account.",
    "Groceries",
    "20% OFF",
    past(1),
    future(20),
    12,
  ).lastInsertRowid;
  insertCoupon.run(
    owner,
    "Weekend tech savings",
    "GizmoHub",
    "TECH500",
    "A flat discount on selected accessories and gadgets.",
    "Minimum purchase ₹2,999. Selected products only.",
    "Electronics",
    "₹500 OFF",
    past(1),
    future(10),
    8,
  );
  insertCoupon.run(
    member,
    "Books for curious minds",
    "ReadMore",
    "READ15",
    "A little encouragement for your next great read.",
    "Valid on paperbacks.",
    "Books",
    "15% OFF",
    past(1),
    future(30),
    5,
  );
  db.prepare(
    "INSERT INTO claims (coupon_id,user_id,claim_code,status) VALUES (?,?,?,?)",
  ).run(c1, member, "DK-DEMO-ASHISH", "claimed");
  const affiliate =
    db.prepare(`INSERT INTO affiliate_offers (title,partner,description,offer,url,category)
    VALUES (?,?,?,?,?,?)`);
  affiliate.run(
    "New customer welcome offer",
    "ShopSphere",
    "A sample partner promotion for first-time shoppers.",
    "Up to 30% OFF",
    "https://example.com/partner/shopsphere",
    "Shopping",
  );
  affiliate.run(
    "Cloud learning bundle",
    "LearnCloud",
    "A sample affiliate listing for online learning.",
    "Save 20%",
    "https://example.com/partner/learncloud",
    "Learning",
  );
  const card = db.prepare(
    `INSERT INTO card_offers (bank,card_name,merchant,offer,category) VALUES (?,?,?,?,?)`,
  );
  card.run(
    "Example Bank",
    "Everyday Rewards Visa",
    "FreshCart",
    "5% cashback up to ₹250",
    "Groceries",
  );
  card.run(
    "Example Bank",
    "Travel Plus Mastercard",
    "TripNest",
    "10% off up to ₹1,000",
    "Travel",
  );
  card.run(
    "Sample Finance",
    "Shopping Credit Card",
    "GizmoHub",
    "Extra 7% off on eligible purchases",
    "Electronics",
  );
  console.log(
    "Seed complete. Demo users: maya@dealkindred.demo / ashish@dealkindred.demo",
  );
  process.exit(0);
};
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
