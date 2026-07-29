export type ProfitTone = "up" | "down" | "flat";

export interface FundHolding {
  id: string;
  name: string;
  amount: number;
  amountDate?: string;
  todayRate?: number;
  actualTodayProfit?: number;
  estimatedTodayProfit?: number;
  relatedBoard?: string;
  holdingProfit: number;
  holdingRate: number;
  favorite?: boolean;
}

export interface Portfolio {
  accountName: string;
  accounts: Array<{ id: number; title: string }>;
  selectedAccountId: number;
  totalAsset: number;
  todayProfit: number;
  todayProfitRate: number;
  updatedAt: string;
  holdings: FundHolding[];
  indices: MarketIndex[];
}

export interface MarketIndex {
  code: string;
  name: string;
  value: number;
  change: number;
  changeRate: number;
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
