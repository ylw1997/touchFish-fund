import * as vscode from "vscode";
import { createHash, randomUUID } from "node:crypto";
import type { LoginPollResult, Portfolio, QrSession } from "./types.js";

const API_BASE_URL = "https://browser-plug-api.yangjibao.com";
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
  index_data?: Record<string, YjbIndexQuote>;
  account_data?: Array<{
    account_id: number;
    title: string;
    today_income: number | string;
    today_income_rate: number | string;
    account_assets: number | string;
  }>;
}

interface YjbIndexQuote {
  code?: string;
  show_code?: string;
  name?: string;
  v?: string | number;
  dir?: string | number;
  div?: string | number;
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
    dwjz?: string;
    jzrq?: string;
    rzzl?: string;
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
  accounts: [
    { id: 1, title: "航天员" },
    { id: 2, title: "小鱼哥" }
  ],
  selectedAccountId: 1,
  totalAsset: 213124.6,
  todayProfit: -903.76,
  todayProfitRate: -0.42,
  updatedAt: "刚刚更新",
  holdings: [
    { id: "110011", name: "易方达瑞锦灵活配置混合", amount: 119258.3, amountDate: "07-29", todayRate: -6.89, actualTodayProfit: -230.2, estimatedTodayProfit: -8216.9, relatedBoard: "海外基金", holdingProfit: 82.44, holdingRate: 0.07 },
    { id: "000066", name: "国金量化多因子股票 A", amount: 37159.92, holdingProfit: -800.68, holdingRate: -2.11, favorite: true },
    { id: "270042", name: "广发纳斯达克100ETF联接", amount: 10659.2, amountDate: "07-28", todayRate: -0.98, relatedBoard: "纳斯达克100", holdingProfit: 1599.2, holdingRate: 17.65 },
    { id: "014805", name: "国金量化多策略混合 A", amount: 7550.87, todayRate: 0.07, relatedBoard: "量化", holdingProfit: -949.13, holdingRate: -11.17 },
    { id: "017641", name: "汇添富纳斯达克100ETF联接", amount: 7242.96, amountDate: "07-28", todayRate: -0.98, relatedBoard: "纳斯达克100", holdingProfit: 72.96, holdingRate: 1.02 },
    { id: "005827", name: "易方达科智量化精选混合", amount: 6073.25, holdingProfit: -426.75, holdingRate: -6.57 },
    { id: "016122", name: "华夏人工智能ETF联接", amount: 5059.07, todayRate: -0.63, relatedBoard: "中证人工智能", holdingProfit: 559.07, holdingRate: 12.42 },
    { id: "011102", name: "天弘中证新能源指数增强", amount: 3676.2, todayRate: 0.91, relatedBoard: "中证新能源", holdingProfit: -523.24, holdingRate: -12.45 }
  ],
  indices: [
    { code: "1.000001", name: "上证指数", value: 3828.47, change: 15.16, changeRate: 0.4 },
    { code: "0.399001", name: "深证成指", value: 13658.44, change: 148.76, changeRate: 1.1 },
    { code: "0.399006", name: "创业板指", value: 3378.7, change: 51.67, changeRate: 1.55 },
    { code: "1.000300", name: "沪深300", value: 4423.81, change: 26.31, changeRate: 0.6 }
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

  async selectAccount(accountId: number): Promise<void> {
    await this.configuration.update(
      "selectedAccountId",
      accountId,
      vscode.ConfigurationTarget.Global
    );
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
      const selectedAccountId = this.configuration.get<number>("selectedAccountId", 0) || 1;
      return {
        ...DEMO_PORTFOLIO,
        accountName: selectedAccountId === 2 ? "小鱼哥" : "航天员",
        selectedAccountId,
        totalAsset: selectedAccountId === 2 ? 48260.18 : DEMO_PORTFOLIO.totalAsset,
        todayProfit: selectedAccountId === 2 ? 126.35 : DEMO_PORTFOLIO.todayProfit,
        todayProfitRate: selectedAccountId === 2 ? 0.26 : DEMO_PORTFOLIO.todayProfitRate,
        holdings:
          selectedAccountId === 2
            ? DEMO_PORTFOLIO.holdings.slice(0, 3)
            : DEMO_PORTFOLIO.holdings,
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
    if (!accountList.length) {
      return {
        accountName: "基金账户",
        accounts: [],
        selectedAccountId: 0,
        totalAsset: 0,
        todayProfit: 0,
        todayProfitRate: 0,
        updatedAt: "暂无数据",
        holdings: [],
        indices: this.normalizeIndices(collect.index_data)
      };
    }
    const configuredId = this.configuration.get<number>("selectedAccountId", 0);
    const selectedAccount =
      accountList.find((account) => account.id === configuredId) ??
      accountList.find((account) => account.title !== "小鱼哥") ??
      accountList[0];
    const rows = await this.request<YjbHolding[]>(
      `/fund_hold?account_id=${encodeURIComponent(String(selectedAccount.id))}`
    );
    const holdings = rows.map((item) =>
      this.normalizeHolding(item, selectedAccount.title)
    );
    const latestTime = rows
      .map((row) => row.nv_info?.time)
      .filter(Boolean)
      .sort()
      .at(-1);
    const selectedSummary = collect.account_data?.find(
      (item) => item.account_id === selectedAccount.id
    );

    return {
      accountName: selectedSummary?.title || selectedAccount.title,
      accounts: accountList.map(({ id, title }) => ({ id, title })),
      selectedAccountId: selectedAccount.id,
      totalAsset: this.number(selectedSummary?.account_assets),
      todayProfit: this.number(selectedSummary?.today_income),
      todayProfitRate: this.number(selectedSummary?.today_income_rate),
      updatedAt: latestTime || new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date()),
      holdings,
      indices: this.normalizeIndices(collect.index_data)
    };
  }

  private normalizeIndices(data?: Record<string, YjbIndexQuote>) {
    const preferredCodes = ["1.000001", "0.399001", "0.399006", "1.000300"];
    if (!data) return [];
    return preferredCodes.flatMap((code) => {
      const item = data[code];
      if (!item) return [];
      return [{
        code: item.code || item.show_code || code,
        name: item.name || "指数",
        value: this.number(item.v),
        change: this.number(item.div),
        changeRate: this.number(item.dir)
      }];
    });
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
    const officialRate = this.firstNumber(
      item.nv_info?.rzzl,
      item.nv_info?.gszzl,
      item.nv_info?.vgszzl,
      item.nv_info?.zsgzzl
    );
    const officialDate = item.nv_info?.jzrq || item.net_day;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai"
    }).format(new Date());
    const officialUpdated = officialDate === today;
    const actualTodayProfit =
      officialUpdated && officialRate != null && 1 + officialRate / 100 !== 0
        ? officialValue - officialValue / (1 + officialRate / 100)
        : undefined;
    const estimatedValue = shares * estimatedNav;
    const base = estimatedValue - estimatedTotalProfit;
    const holdingRate = base === 0 ? 0 : (estimatedTotalProfit / base) * 100;

    return {
      id: `${accountTitle}-${item.id}`,
      name: item.short_name || item.code,
      amount: estimatedNav === lastNet ? officialValue : estimatedValue,
      amountDate: officialDate?.slice(5),
      todayRate: estimatedRate,
      actualTodayProfit,
      estimatedTodayProfit: estimatedDayProfit,
      relatedBoard: item.sector_info?.name || undefined,
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
    const token = options.authenticated === false ? "" : this.token;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signPath = new URL(path, API_BASE_URL).pathname;
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

    const response = await fetch(`${API_BASE_URL}${path}`, {
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
