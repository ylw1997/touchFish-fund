import * as vscode from "vscode";
import { FundApi } from "./fundApi.js";
import { FundViewProvider } from "./fundViewProvider.js";
import type { MarketIndex, Portfolio } from "./types.js";

interface StatusIndexItem extends vscode.QuickPickItem {
  index: MarketIndex;
}

function formatRate(value: number): string {
  const formatted = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Math.abs(value));
  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return "0%";
}

export function activate(context: vscode.ExtensionContext): void {
  const api = new FundApi();
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  status.name = "基金收益与指数";
  status.command = "fundView.selectStatusIndex";
  let latestPortfolio: Portfolio | undefined;

  const selectedIndex = (portfolio: Portfolio): MarketIndex | undefined => {
    const code = vscode.workspace
      .getConfiguration("fundView")
      .get<string>("statusBarIndexCode", "1.000001");
    return portfolio.statusIndices.find((index) => index.code === code) ?? portfolio.statusIndices[0];
  };

  const renderStatus = (portfolio?: Portfolio): void => {
    const config = vscode.workspace.getConfiguration("fundView");
    if (!config.get<boolean>("showStatusBar", true)) {
      status.hide();
      return;
    }

    if (!api.token) {
      status.text = "$(graph) 基金：未登录";
      status.tooltip = "点击打开基金看板";
      status.show();
      return;
    }
    if (!portfolio) {
      status.text = "$(sync~spin) 基金：刷新中";
      status.tooltip = "正在刷新收益与指数";
      status.show();
      return;
    }

    const index = selectedIndex(portfolio);
    const accountPart = `${portfolio.accountName} ${portfolio.todayProfit.toFixed(2)} ${formatRate(portfolio.todayProfitRate)}`;
    const indexPart = index
      ? `  ${index.name} ${index.value.toFixed(2)} ${formatRate(index.changeRate)}`
      : "";
    status.text = `$(graph-line) ${accountPart}${indexPart}`;
    status.tooltip = new vscode.MarkdownString(
      `${portfolio.accountName} · 总资产 ¥${portfolio.totalAsset.toFixed(2)} · ${portfolio.updatedAt}\n\n点击选择状态栏指数`
    );
    status.show();
  };

  const renderStatusError = (error: unknown): void => {
    if (!vscode.workspace.getConfiguration("fundView").get<boolean>("showStatusBar", true)) {
      status.hide();
      return;
    }
    status.text = "$(warning) 基金：刷新失败";
    status.tooltip = error instanceof Error ? error.message : "刷新失败";
    status.show();
  };

  let refreshAll: () => Promise<void> = async () => undefined;
  const provider = new FundViewProvider(context.extensionUri, api, () => refreshAll());
  const register = vscode.window.registerWebviewViewProvider(FundViewProvider.viewType, provider, {
    webviewOptions: { retainContextWhenHidden: true }
  });

  let refreshPromise: Promise<void> | undefined;
  refreshAll = (): Promise<void> => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      await provider.setBusy(true);
      try {
        if (!api.token) {
          latestPortfolio = undefined;
          renderStatus();
          await provider.refresh();
          return;
        }

        const portfolio = await api.getPortfolio();
        latestPortfolio = portfolio;
        renderStatus(portfolio);
        await provider.refresh(portfolio);
      } catch (error) {
        renderStatusError(error);
        await provider.showError(error);
      } finally {
        await provider.setBusy(false);
      }
    })()
      .finally(() => {
        refreshPromise = undefined;
      });
    return refreshPromise;
  };

  const refresh = vscode.commands.registerCommand("fundView.refresh", async () => {
    await refreshAll();
  });
  const open = vscode.commands.registerCommand("fundView.open", async () => {
    await vscode.commands.executeCommand("workbench.view.extension.fundView");
    await vscode.commands.executeCommand("fundView.portfolio.focus");
    await refreshAll();
  });
  const login = vscode.commands.registerCommand("fundView.login", async () => {
    await vscode.commands.executeCommand("workbench.view.extension.fundView");
    await provider.showLogin();
  });
  const logout = vscode.commands.registerCommand("fundView.logout", async () => {
    await api.clearToken();
    await provider.showLogin();
    await refreshAll();
  });
  const selectStatusIndex = vscode.commands.registerCommand(
    "fundView.selectStatusIndex",
    async () => {
      if (!api.token) {
        await vscode.window.showInformationMessage("请先登录基金账户");
        await vscode.commands.executeCommand("fundView.open");
        return;
      }

      const portfolio = latestPortfolio ?? await api.getPortfolio();
      latestPortfolio = portfolio;
      const current = selectedIndex(portfolio);
      const items: StatusIndexItem[] = portfolio.statusIndices.map((index) => ({
        label: index.name,
        description: index.code,
        detail: `${index.value.toFixed(2)}  ${formatRate(index.changeRate)}`,
        picked: index.code === current?.code,
        index
      }));
      if (!items.length) {
        await vscode.window.showInformationMessage("暂无可显示的指数数据");
        return;
      }

      const choice = await vscode.window.showQuickPick(items, {
        placeHolder: "选择状态栏显示的指数",
        matchOnDescription: true,
        matchOnDetail: true
      });
      if (!choice) return;
      await vscode.workspace.getConfiguration("fundView").update(
        "statusBarIndexCode",
        choice.index.code,
        vscode.ConfigurationTarget.Global
      );
      renderStatus(portfolio);
    }
  );
  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("fundView.statusBarIndexCode")) {
      renderStatus(latestPortfolio);
      return;
    }
    if (event.affectsConfiguration("fundView")) {
      void refreshAll();
      restartTimer();
    }
  });

  let refreshTimer: NodeJS.Timeout | undefined;
  const restartTimer = () => {
    if (refreshTimer) clearInterval(refreshTimer);
    const seconds = Math.max(
      60,
      vscode.workspace.getConfiguration("fundView").get<number>("refreshInterval", 60)
    );
    refreshTimer = setInterval(() => void refreshAll(), seconds * 1000);
  };

  restartTimer();
  void refreshAll();
  context.subscriptions.push(
    register,
    refresh,
    open,
    login,
    logout,
    selectStatusIndex,
    configListener,
    status,
    { dispose: () => refreshTimer && clearInterval(refreshTimer) }
  );
}

export function deactivate(): void {}
