import * as vscode from "vscode";
import { FundApi } from "./fundApi.js";
import { FundViewProvider } from "./fundViewProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const api = new FundApi();
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  status.name = "基金当日收益";
  status.command = "fundView.open";

  const updateStatus = async () => {
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

    try {
      const portfolio = await api.getPortfolio();
      const value = portfolio.todayProfit;
      const sign = value > 0 ? "+" : "";
      status.text =
        `$(graph-line) ${portfolio.accountName} ${sign}${value.toFixed(2)}`;
      status.tooltip =
        `${portfolio.accountName} · 总资产 ¥${portfolio.totalAsset.toFixed(2)} · ${portfolio.updatedAt}`;
      status.show();
    } catch (error) {
      status.text = "$(warning) 基金：刷新失败";
      status.tooltip = error instanceof Error ? error.message : "刷新失败";
      status.show();
    }
  };

  const provider = new FundViewProvider(context.extensionUri, api, updateStatus);
  const register = vscode.window.registerWebviewViewProvider(FundViewProvider.viewType, provider, {
    webviewOptions: { retainContextWhenHidden: true }
  });

  let refreshPromise: Promise<void> | undefined;
  const refreshAll = (): Promise<void> => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = Promise.all([provider.refresh(), updateStatus()])
      .then(() => undefined)
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
    await updateStatus();
  });
  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
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
  void updateStatus();
  context.subscriptions.push(
    register,
    refresh,
    open,
    login,
    logout,
    configListener,
    status,
    { dispose: () => refreshTimer && clearInterval(refreshTimer) }
  );
}

export function deactivate(): void {}
