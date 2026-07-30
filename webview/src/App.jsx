import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  ConfigProvider,
  Empty,
  Skeleton,
  Spin,
  Tabs,
  Typography,
  theme
} from "antd";
import {
  EyeOutlined,
  DownOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  UpOutlined
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";

const DEMO_PORTFOLIO = {
  accountName: "航天员",
  accounts: [
    { id: 1, title: "航天员" },
    { id: 2, title: "小鱼哥" }
  ],
  selectedAccountId: 1,
  totalAsset: 213124.6,
  todayProfit: -903.76,
  todayProfitRate: -0.42,
  updatedAt: "14:30:00",
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

const previewUsesDefaultTextColor =
  new URLSearchParams(window.location.search).get("defaultTextColor") === "1";

const browserBridge = {
  postMessage(message) {
    const dispatch = () =>
      window.dispatchEvent(
        new MessageEvent("message", {
        data:
          message.type === "startLogin"
            ? {
                type: "qrSession",
                payload: {
                  ticket: "preview-ticket",
                  qrText: "fund-view://preview-login",
                  expiresAt: Date.now() + 120_000
                }
              }
            : message.type === "demoLogin" || message.type === "refresh"
              ? {
                  type: "initialState",
                  payload: {
                    loggedIn: true,
                    demo: true,
                    useDefaultTextColor: previewUsesDefaultTextColor,
                    portfolio: DEMO_PORTFOLIO
                  }
                }
              : message.type === "selectAccount"
                ? {
                    type: "initialState",
                    payload: {
                      loggedIn: true,
                      demo: true,
                      useDefaultTextColor: previewUsesDefaultTextColor,
                      portfolio: {
                        ...DEMO_PORTFOLIO,
                        accountName: message.accountId === 2 ? "小鱼哥" : "航天员",
                        selectedAccountId: message.accountId,
                        totalAsset: message.accountId === 2 ? 48260.18 : DEMO_PORTFOLIO.totalAsset,
                        todayProfit: message.accountId === 2 ? 126.35 : DEMO_PORTFOLIO.todayProfit,
                        todayProfitRate:
                          message.accountId === 2 ? 0.26 : DEMO_PORTFOLIO.todayProfitRate,
                        holdings:
                          message.accountId === 2
                            ? DEMO_PORTFOLIO.holdings.slice(0, 3)
                            : DEMO_PORTFOLIO.holdings
                      }
                    }
                  }
              : message.type === "logout"
                ? { type: "signedOut" }
                : {
                    type: "initialState",
                    payload: {
                      loggedIn: false,
                      demo: true,
                      useDefaultTextColor: previewUsesDefaultTextColor
                    }
                  }
        })
      );
    if (message.type === "refresh" || message.type === "selectAccount") {
      window.setTimeout(dispatch, 1500);
    } else {
      dispatch();
    }
  }
};

const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : browserBridge;
const money = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function tone(value) {
  if (value > 0) return "profit-up";
  if (value < 0) return "profit-down";
  return "profit-flat";
}

function signed(value, suffix = "") {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${money.format(value)}${suffix}`;
}

function LoginView({ qrSession, loginStatus, error, demo, onStart, onDemo }) {
  useEffect(() => {
    onStart();
  }, [onStart]);

  return (
    <section className="login-view">
      <div className="login-mark">
        <SafetyCertificateOutlined />
      </div>
      <Typography.Title level={3}>扫码登录基金账户</Typography.Title>
      <Typography.Paragraph type="secondary">
        使用账户所属客户端扫描二维码，确认后自动进入看板
      </Typography.Paragraph>
      <div className="qr-card">
        {qrSession ? (
          <QRCodeSVG value={qrSession.qrText} size={164} level="M" />
        ) : (
          <Skeleton.Node active className="qr-skeleton" />
        )}
        {loginStatus === "scanned" && <div className="qr-mask">已扫码，请在手机上确认</div>}
      </div>
      <div className="login-status" role="status">
        {error || (loginStatus === "expired" ? "二维码已过期，请刷新" : "二维码将在 2 分钟后失效")}
      </div>
      <Button onClick={onStart} icon={<ReloadOutlined />}>刷新二维码</Button>
      {demo && <Button type="link" onClick={onDemo}>先体验演示账户</Button>}
      <div className="privacy-note">Token 登录成功后保存到 VS Code 全局配置</div>
    </section>
  );
}

function Summary({ portfolio, hidden, onToggle }) {
  return (
    <section className="summary">
      <div className="summary-item">
        <div className="summary-label">
          账户资产
          <button className="icon-button" onClick={onToggle} aria-label={hidden ? "显示资产" : "隐藏资产"}>
            <EyeOutlined />
          </button>
        </div>
        <div className="summary-value">{hidden ? "••••••" : money.format(portfolio.totalAsset)}</div>
      </div>
      <div className="summary-item summary-profit">
        <div className="summary-label">
          当日收益
        </div>
        <div className="summary-profit-line">
          <div className={`summary-value ${tone(portfolio.todayProfit)}`}>
            {hidden ? "••••" : signed(portfolio.todayProfit)}
          </div>
          <div className={`summary-rate ${tone(portfolio.todayProfitRate)}`}>
            {hidden ? "••" : signed(portfolio.todayProfitRate, "%")}
          </div>
        </div>
      </div>
      <div className="summary-meta">{portfolio.updatedAt} 更新</div>
    </section>
  );
}

function MarketStrip({ indices }) {
  const [compact, setCompact] = useState(true);
  if (!indices?.length) return null;
  const primary = indices[0];

  return (
    <div className={`market-dock ${compact ? "compact" : "expanded"}`}>
      <section className="market-strip">
        {compact ? (
          <button className="market-summary" onClick={() => setCompact(false)}>
            <span className="market-name">{primary.name}</span>
            <span className={tone(primary.changeRate)}>{money.format(primary.value)}</span>
            <span className={tone(primary.change)}>{signed(primary.change)}</span>
            <span className={tone(primary.changeRate)}>{signed(primary.changeRate, "%")}</span>
            <UpOutlined />
          </button>
        ) : (
          <>
            <div className="market-header">
              <span>大盘指数</span>
              <button className="icon-button" onClick={() => setCompact(true)} aria-label="收起指数">
                <DownOutlined />
              </button>
            </div>
            <div className="market-cards">
              {indices.map((index) => (
                <article className={`market-card ${tone(index.changeRate)}`} key={index.code}>
                  <div className="market-name">{index.name}</div>
                  <strong>{money.format(index.value)}</strong>
                  <div>
                    <span>{signed(index.change)}</span>
                    <span>{signed(index.changeRate, "%")}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function HoldingRow({ fund, hidden }) {
  const estimatedTodayProfit =
    fund.estimatedTodayProfit ??
    (fund.todayRate == null ? undefined : fund.amount * fund.todayRate / 100);
  const todayProfit = fund.actualTodayProfit ?? estimatedTodayProfit;
  const isEstimated = fund.actualTodayProfit == null && estimatedTodayProfit != null;

  return (
    <article className="holding-row">
      <div className="holding-main">
        <div className="holding-name">{fund.name}</div>
        <div className="holding-sub">
          {fund.actualTodayProfit != null && <span className="updated-badge">已更新</span>}
          ¥ {hidden ? "••••" : money.format(fund.amount)}
          {fund.amountDate && <span>{fund.amountDate}</span>}
          {fund.favorite && <StarFilled className="favorite" />}
        </div>
      </div>
      <div className="holding-day">
        <div className={`holding-day-value ${tone(todayProfit ?? 0)}`}>
          {isEstimated && <span className="estimate-badge">估</span>}
          {todayProfit == null
            ? "—"
            : hidden
              ? "••••"
              : signed(todayProfit)}
        </div>
      </div>
      <div className="holding-valuation">
        <div className={tone(fund.todayRate ?? 0)}>
          {fund.todayRate == null ? "—" : signed(fund.todayRate, "%")}
        </div>
        <div className="holding-sub board-name">{fund.relatedBoard || "—"}</div>
      </div>
      <div className="holding-profit">
        <div className={tone(fund.holdingProfit)}>
          {hidden ? "••••" : signed(fund.holdingProfit)}
        </div>
        <div className={`holding-rate ${tone(fund.holdingRate)}`}>
          {hidden ? "••" : signed(fund.holdingRate, "%")}
        </div>
      </div>
    </article>
  );
}

function PortfolioView({
  portfolio,
  busy,
  useDefaultTextColor,
  onRefresh,
  onLogout,
  onSelectAccount
}) {
  const [hidden, setHidden] = useState(false);
  const accountItems = portfolio.accounts.map((account) => ({
    key: String(account.id),
    label: account.title
  }));
  const sortedHoldings = [...portfolio.holdings].sort(
    (left, right) =>
      Number(right.actualTodayProfit != null) - Number(left.actualTodayProfit != null)
  );

  return (
    <main className={`portfolio ${useDefaultTextColor ? "default-profit-color" : ""}`}>
      <header className="topbar">
        <h1 className="sr-only">{portfolio.accountName}</h1>
        <Tabs
          className="account-tabs"
          aria-label="基金账户"
          size="small"
          activeKey={String(portfolio.selectedAccountId)}
          items={accountItems}
          onChange={(accountId) => onSelectAccount(Number(accountId))}
        />
        <div className="topbar-actions">
          <button
            className="icon-button"
            onClick={onRefresh}
            aria-label="刷新"
            disabled={busy}
          >
            <ReloadOutlined className={busy ? "spin-icon" : ""} />
          </button>
          <button className="icon-button" onClick={onLogout} aria-label="退出登录">
            <LogoutOutlined />
          </button>
        </div>
      </header>
      <Summary portfolio={portfolio} hidden={hidden} onToggle={() => setHidden((value) => !value)} />
      <div className="table-head">
        <span>基金 / 持有金额</span>
        <span>当日收益</span>
        <span>实时估值</span>
        <span>持有收益</span>
      </div>
      <section className="holding-list" key={portfolio.selectedAccountId}>
        {sortedHoldings.length ? (
          sortedHoldings.map((fund) => <HoldingRow key={fund.id} fund={fund} hidden={hidden} />)
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无持仓" />
        )}
      </section>
      <MarketStrip indices={portfolio.indices} />
      {busy && (
        <div className="refresh-notice" role="status">
          <Spin size="small" />
          <span>刷新中</span>
        </div>
      )}
    </main>
  );
}

export function App() {
  const [state, setState] = useState({ loading: true, loggedIn: false, demo: true });
  const [qrSession, setQrSession] = useState();
  const [loginStatus, setLoginStatus] = useState("pending");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLight = !document.body.classList.contains("vscode-dark");
  const startLogin = useCallback(() => vscode.postMessage({ type: "startLogin" }), []);
  const demoLogin = useCallback(() => vscode.postMessage({ type: "demoLogin" }), []);

  useEffect(() => {
    const handleMessage = ({ data }) => {
      if (data.type === "initialState") {
        setState({ loading: false, ...data.payload });
        setBusy(false);
      }
      if (data.type === "busy") setBusy(Boolean(data.payload));
      if (data.type === "qrSession") {
        setQrSession(data.payload);
        setLoginStatus("pending");
        setError("");
      }
      if (data.type === "loginStatus") setLoginStatus(data.payload.status);
      if (data.type === "signedOut") {
        setState((current) => ({ ...current, loading: false, loggedIn: false }));
        setQrSession(undefined);
      }
      if (data.type === "error") setError(data.message);
    };
    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const antdTheme = useMemo(
    () => ({
      algorithm: isLight ? theme.defaultAlgorithm : theme.darkAlgorithm,
      token: {
        colorPrimary: "#4f6ef7",
        colorText: "var(--vscode-foreground, #17234a)",
        colorTextSecondary: "var(--vscode-descriptionForeground, #7d879f)",
        colorBgContainer: "var(--vscode-sideBar-background, #ffffff)",
        colorBorderSecondary: "var(--vscode-sideBarSectionHeader-border, #edf0f5)",
        borderRadius: 8,
        fontFamily: "var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)"
      }
    }),
    [isLight]
  );

  return (
    <ConfigProvider theme={antdTheme}>
      {state.loading ? (
        <div className="loading-view"><Skeleton active paragraph={{ rows: 8 }} /></div>
      ) : state.loggedIn && state.portfolio ? (
        <PortfolioView
          portfolio={state.portfolio}
          busy={busy}
          useDefaultTextColor={Boolean(state.useDefaultTextColor)}
          onRefresh={() => {
            setBusy(true);
            vscode.postMessage({ type: "refresh" });
          }}
          onLogout={() => vscode.postMessage({ type: "logout" })}
          onSelectAccount={(accountId) => {
            setBusy(true);
            vscode.postMessage({ type: "selectAccount", accountId });
          }}
        />
      ) : (
        <LoginView
          qrSession={qrSession}
          loginStatus={loginStatus}
          error={error}
          demo={state.demo}
          onStart={startLogin}
          onDemo={demoLogin}
        />
      )}
    </ConfigProvider>
  );
}
