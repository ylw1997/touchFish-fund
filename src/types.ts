export type ProfitTone = "up" | "down" | "flat";

export interface FundHolding {
  id: string;
  name: string;
  amount: number;
  amountDate?: string;
  todayRate?: number;
  relatedBoard?: string;
  holdingProfit: number;
  holdingRate: number;
  favorite?: boolean;
}

export interface Portfolio {
  accountName: string;
  totalAsset: number;
  todayProfit: number;
  updatedAt: string;
  holdings: FundHolding[];
}

export interface QrSession {
  ticket: string;
  qrText: string;
  expiresAt: number;
}

export interface LoginPollResult {
  status: "pending" | "scanned" | "expired" | "confirmed";
  token?: string;
}
