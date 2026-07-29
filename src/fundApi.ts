import * as vscode from "vscode";
import { createHash, randomUUID } from "node:crypto";
import type { LoginPollResult, Portfolio, QrSession } from "./types.js";

const DEFAULT_BASE_URL = "https://browser-plug-api.yangjibao.com";
const SIGN_SECRET = "YxmKSrQR4uoJ5lOoWIhcbd7SlUEh9OOc";

interface ApiEnvelope<T> {
  code: number;
  message?: string;
  data: T;
}

interface YjbQrSession {
  id: string;
  url: string;
}

interface YjbQrState {
  state: string | number;
  token?: string;
}

interface YjbAccount {
  id: number;
  title: string;
}

interface YjbAccounts {
  list: YjbAccount[];
  all_account_config?: { title?: string };
}

interface YjbAccountCollect {
  assets_collect: number | string;
  today_income: number | string;
}

interface YjbHolding {
  id: number;
  code: string;
  short_name: string;
  hold_share: number | string;
  hold_earn: number | string;
  last_net: number | string;
  money: number | string;
  net_day?: string;
  is_care?: boolean;
  sector_info?: { name?: string | null };
  nv_info?: {
    gsz?: string;
    gszzl?: string;
    vgsz?: string;
    vgszzl?: string;
    zsgz?: string;
    zsgzzl?: string;
    time?: string;
  };
}

const DEMO_PORTFOLIO: Portfolio = {
  accountName: "基金账户",
  totalAsset: 213124.6,
  todayProfit: -903.76,
  updatedAt: "刚刚更新",
  holdings: [
    { id: "110011", name: "易方达瑞锦灵活配置混合", amount: 119258.3, holdingProfit: 82.44, holdingRate: 0.07 },
    { id: "000066", name: "国金量化多因子股票 A", amount: 37159.92, holdingProfit: -800.68, holdingRate: -2.11, favorite: true },
    { id: "270042", name: "广发纳斯达克100ETF联接", amount: 10659.2, amountDate: "07-28", todayRate: -0.98, relatedBoard: "纳斯达克100", holdingProfit: 1599.2, holdingRate: 17.65 },
    { id: "014805", name: "国金量化多策略混合 A", amount: 7550.87, todayRate: 0.07, relatedBoard: "量化", holdingProfit: -949.13, holdingRate: -11.17 },
    { id: "017641", name: "汇添富纳斯达克100ETF联接", amount: 7242.96, amountDate: "07-28", todayRate: -0.98, relatedBoard: "纳斯达克100", holdingProfit: 72.96, holdingRate: 1.02 },
    { id: "005827", name: "易方达科智量化精选混合", amount: 6073.25, holdingProfit: -426.75, holdingRate: -6.57 },
    { id: "016122", name: "华夏人工智能ETF联接", amount: 5059.07, todayRate: -0.63, relatedBoard: "中证人工智能", holdingProfit: 559.07, holdingRate: 12.42 },
    { id: "011102", name: "天弘中证新能源指数增强", amount: 3676.2, todayRate: 0.91, relatedBoard: "中证新能源", holdingProfit: -523.24, holdingRate: -12.45 }
  ]
};

export class FundApi {
  private get configuration() {
    return vscode.workspace.getConfiguration("fundView");
  }

  get token(): string {
    return this.configuration.get<string>("token", "").trim();
  }

  get isDemo(): boolean {
    return this.configuration.get<boolean>("useDemoData", false);
  }

  async saveToken(token: string): Promise<void> {
    await this.configuration.update("token", token, vscode.ConfigurationTarget.Global);
  }

  async clearToken(): Promise<void> {
    await this.saveToken("");
  }

  async beginQrLogin(): Promise<QrSession> {
    if (this.isDemo) {
      const ticket = randomUUID();
      return {
        ticket,
        qrText: `fund-view://login?ticket=${ticket}`,
        expiresAt: Date.now() + 120_000
      };
    }

    const session = await this.request<YjbQrSession>("/qr_code", { authenticated: false });
    return {
      ticket: String(session.id),
      qrText: session.url,
      expiresAt: Date.now() + 120_000
    };
  }

  async pollQrLogin(ticket: string): Promise<LoginPollResult> {
    if (this.isDemo) {
      return { status: Date.now() % 10_000 > 7_500 ? "scanned" : "pending" };
    }

    const result = await this.request<YjbQrState>(
      `/qr_code_state/${encodeURIComponent(ticket)}`,
      { authenticated: false }
    );
    const state = String(result.state);
    if (state === "2" && result.token) return { status: "confirmed", token: result.token };
    if (state === "0") return { status: "expired" };
    if (state === "3") return { status: "scanned" };
    return { status: "pending" };
  }

  async useDemoAccount(): Promise<string> {
    if (!this.isDemo) {
      throw new Error("请先在设置中启用 fundView.useDemoData");
    }
    const token = "demo-local-token";
    await this.saveToken(token);
    return token;
  }

  async getPortfolio(): Promise<Portfolio> {
    if (this.isDemo) {
      return {
        ...DEMO_PORTFOLIO,
        updatedAt: new Intl.DateTimeFormat("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }).format(new Date())
      };
    }

    const [accounts, collect] = await Promise.all([
      this.request<YjbAccounts>("/user_account"),
      this.request<YjbAccountCollect>("/account_collect")
    ]);
    const accountList = accounts.list ?? [];
    const holdingsByAccount = await Promise.all(
      accountList.map(async (account) => ({
        account,
        holdings: await this.request<YjbHolding[]>(
          `/fund_hold?account_id=${encodeURIComponent(String(account.id))}`
        )
      }))
    );
    const holdings = holdingsByAccount.flatMap(({ account, holdings: rows }) =>
      rows.map((item) => this.normalizeHolding(item, account.title))
    );
    const latestTime = holdingsByAccount
      .flatMap(({ holdings: rows }) => rows.map((row) => row.nv_info?.time).filter(Boolean))
      .sort()
      .at(-1);

    return {
      accountName:
        accountList.length === 1
          ? accountList[0].title
          : accounts.all_account_config?.title || "全部账户",
      totalAsset: this.number(collect.assets_collect),
      todayProfit: this.number(collect.today_income),
      updatedAt: latestTime || new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date()),
      holdings
    };
  }

  private normalizeHolding(item: YjbHolding, accountTitle: string) {
    const shares = this.number(item.hold_share);
    const lastNet = this.number(item.last_net);
    const estimatedNav = this.firstPositiveNumber(
      item.nv_info?.gsz,
      item.nv_info?.vgsz,
      item.nv_info?.zsgz,
      item.last_net
    ) ?? lastNet;
    const estimatedRate = this.firstNumber(
      item.nv_info?.gszzl,
      item.nv_info?.vgszzl,
      item.nv_info?.zsgzzl
    );
    const estimatedDayProfit = shares * (estimatedNav - lastNet);
    const estimatedTotalProfit = this.number(item.hold_earn) + estimatedDayProfit;
    const officialValue = this.number(item.money);
    const estimatedValue = shares * estimatedNav;
    const base = estimatedValue - estimatedTotalProfit;
    const holdingRate = base === 0 ? 0 : (estimatedTotalProfit / base) * 100;

    return {
      id: `${accountTitle}-${item.id}`,
      name: item.short_name || item.code,
      amount: estimatedNav === lastNet ? officialValue : estimatedValue,
      amountDate: item.net_day?.slice(5),
      todayRate: estimatedRate,
      relatedBoard: item.sector_info?.name || accountTitle,
      holdingProfit: estimatedTotalProfit,
      holdingRate,
      favorite: Boolean(item.is_care)
    };
  }

  private number(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private firstNumber(...values: unknown[]): number | undefined {
    for (const value of values) {
      if (value === "" || value == null) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }

  private firstPositiveNumber(...values: unknown[]): number | undefined {
    for (const value of values) {
      if (value === "" || value == null) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return undefined;
  }

  private async request<T>(
    path: string,
    options: { authenticated?: boolean } = {}
  ): Promise<T> {
    const baseUrl = this.configuration
      .get<string>("apiBaseUrl", DEFAULT_BASE_URL)
      .trim()
      .replace(/\/+$/, "");
    if (!baseUrl.startsWith("https://")) {
      throw new Error("养基宝 API 地址必须使用 HTTPS");
    }
    const token = options.authenticated === false ? "" : this.token;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signPath = new URL(path, baseUrl).pathname;
    const signature = createHash("md5")
      .update(`${signPath}${token}${timestamp}${SIGN_SECRET}`)
      .digest("hex");
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
      "Request-Time": timestamp,
      "Request-Sign": signature,
      Authorization: token
    });

    const response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15_000)
    });

    if (response.status === 401) {
      await this.clearToken();
      throw new Error("Token 已失效，请重新扫码登录");
    }
    if (response.status === 429) {
      throw new Error("养基宝请求过于频繁，请稍后再试");
    }
    if (!response.ok) {
      throw new Error(`养基宝请求失败（HTTP ${response.status}）`);
    }
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (payload.code !== 200) {
      throw new Error(payload.message || "养基宝业务请求失败");
    }
    return payload.data;
  }
}
