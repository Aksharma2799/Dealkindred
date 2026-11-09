import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import couponRoutes from "./routes/coupons.js";
import claimRoutes from "./routes/claims.js";
import marketRoutes from "./routes/market.js";
import { notFound, errorHandler } from "./middleware/errors.js";
import "./db/database.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 60 }),
  authRoutes,
);
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "DealKindred API" }),
);
app.use("/api/coupons", couponRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api", marketRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`DealKindred API running at http://localhost:${port}`),
);
