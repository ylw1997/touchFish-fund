import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  ConfigProvider,
  Empty,
  Skeleton,
  Tooltip,
  Typography,
  theme
} from "antd";
import {
  EyeOutlined,
  LogoutOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  StarFilled
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";

const DEMO_PORTFOLIO = {
  accountName: "基金账户",
  totalAsset: 213124.6,
  todayProfit: -903.76,
  updatedAt: "14:30:00",
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

const browserBridge = {
  postMessage(message) {
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
                  payload: { loggedIn: true, demo: true, portfolio: DEMO_PORTFOLIO }
                }
              : message.type === "logout"
                ? { type: "signedOut" }
                : { type: "initialState", payload: { loggedIn: false, demo: true } }
      })
    );
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
          <ReloadOutlined />
          当日收益
        </div>
        <div className={`summary-value ${tone(portfolio.todayProfit)}`}>
          {hidden ? "••••" : signed(portfolio.todayProfit)}
        </div>
      </div>
      <div className="summary-meta">{portfolio.updatedAt} 更新</div>
    </section>
  );
}

function HoldingRow({ fund, hidden }) {
  return (
    <article className="holding-row">
      <div className="holding-main">
        <Tooltip title={fund.name} placement="topLeft">
          <div className="holding-name">{fund.name}</div>
        </Tooltip>
        <div className="holding-sub">
          ¥ {hidden ? "••••" : money.format(fund.amount)}
          {fund.amountDate && <span>{fund.amountDate}</span>}
          {fund.favorite && <StarFilled className="favorite" />}
        </div>
      </div>
      <div className="holding-board">
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

function PortfolioView({ portfolio, onRefresh, onLogout }) {
  const [hidden, setHidden] = useState(false);
  return (
    <main className="portfolio">
      <header className="topbar">
        <div>
          <div className="eyebrow">账户汇总</div>
          <h1>{portfolio.accountName}</h1>
        </div>
        <div className="topbar-actions">
          <Tooltip title="刷新">
            <button className="icon-button" onClick={onRefresh} aria-label="刷新">
              <ReloadOutlined />
            </button>
          </Tooltip>
          <Tooltip title="退出登录">
            <button className="icon-button" onClick={onLogout} aria-label="退出登录">
              <LogoutOutlined />
            </button>
          </Tooltip>
        </div>
      </header>
      <Summary portfolio={portfolio} hidden={hidden} onToggle={() => setHidden((value) => !value)} />
      <div className="table-head">
        <span>基金 / 持有金额</span>
        <span>当日估值</span>
        <span>持有收益</span>
      </div>
      <section className="holding-list">
        {portfolio.holdings.length ? (
          portfolio.holdings.map((fund) => <HoldingRow key={fund.id} fund={fund} hidden={hidden} />)
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无持仓" />
        )}
      </section>
    </main>
  );
}

export function App() {
  const [state, setState] = useState({ loading: true, loggedIn: false, demo: true });
  const [qrSession, setQrSession] = useState();
  const [loginStatus, setLoginStatus] = useState("pending");
  const [error, setError] = useState("");
  const isLight = !document.body.classList.contains("vscode-dark");
  const startLogin = useCallback(() => vscode.postMessage({ type: "startLogin" }), []);
  const demoLogin = useCallback(() => vscode.postMessage({ type: "demoLogin" }), []);

  useEffect(() => {
    const handleMessage = ({ data }) => {
      if (data.type === "initialState") setState({ loading: false, ...data.payload });
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
          onRefresh={() => vscode.postMessage({ type: "refresh" })}
          onLogout={() => vscode.postMessage({ type: "logout" })}
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
