export type User = { id: number; name: string; email: string };
export type Coupon = {
  id: number;
  title: string;
  brand: string;
  description: string;
  terms: string;
  category: string;
  discount: string;
  startsAt: string;
  expiresAt: string;
  quantity: number;
  remaining: number;
  ownerName: string;
};
export type Claim = {
  id: number;
  claimCode: string;
  status: "claimed" | "redeemed";
  claimedAt: string;
  redeemedAt?: string;
  title?: string;
  brand?: string;
  discount?: string;
  expiresAt?: string;
  userName?: string;
  userEmail?: string;
};
