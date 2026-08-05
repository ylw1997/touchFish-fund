import * as vscode from "vscode";
import type { FundApi } from "./fundApi.js";
import type { Portfolio } from "./types.js";

export class FundViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "fundView.portfolio";
  private view?: vscode.WebviewView;
  private pollTimer?: NodeJS.Timeout;
  private pollExpiresAt = 0;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly api: FundApi,
    private readonly onPortfolioUpdated: () => Promise<void>
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "webview", "dist", "client")
      ]
    };
    view.webview.html = this.getHtml(view.webview);
    view.webview.onDidReceiveMessage((message) => void this.handleMessage(message));
    view.onDidDispose(() => this.stopPolling());
  }

  async refresh(portfolio?: Portfolio): Promise<void> {
    if (!this.view) return;
    try {
      await this.sendInitialState(portfolio);
    } catch (error) {
      await this.showError(error);
    }
  }

  async setBusy(busy: boolean): Promise<void> {
    await this.view?.webview.postMessage({ type: "busy", payload: busy });
  }

  async showError(error: unknown): Promise<void> {
    await this.view?.webview.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "刷新失败"
    });
  }

  async showLogin(): Promise<void> {
    await this.api.clearToken();
    await this.view?.webview.postMessage({ type: "signedOut" });
  }

  private async handleMessage(
    message: { type?: string; ticket?: string; accountId?: number }
  ): Promise<void> {
    try {
      switch (message.type) {
        case "ready":
          await this.onPortfolioUpdated();
          break;
        case "refresh":
          await this.onPortfolioUpdated();
          break;
        case "startLogin": {
          this.stopPolling();
          const session = await this.api.beginQrLogin();
          await this.view?.webview.postMessage({ type: "qrSession", payload: session });
          this.pollExpiresAt = session.expiresAt;
          this.pollTimer = setInterval(() => void this.pollLogin(session.ticket), 3_000);
          break;
        }
        case "demoLogin":
          this.stopPolling();
          await this.api.useDemoAccount();
          await this.onPortfolioUpdated();
          break;
        case "logout":
          this.stopPolling();
          await this.api.clearToken();
          await this.view?.webview.postMessage({ type: "signedOut" });
          await this.onPortfolioUpdated();
          break;
        case "selectAccount":
          if (typeof message.accountId !== "number") {
            throw new Error("账户 ID 无效");
          }
          await this.api.selectAccount(message.accountId);
          await this.onPortfolioUpdated();
          break;
      }
    } catch (error) {
      await this.view?.webview.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "操作失败"
      });
    }
  }

  private async pollLogin(ticket: string): Promise<void> {
    try {
      if (Date.now() >= this.pollExpiresAt) {
        this.stopPolling();
        await this.view?.webview.postMessage({
          type: "loginStatus",
          payload: { status: "expired" }
        });
        return;
      }
      const result = await this.api.pollQrLogin(ticket);
      await this.view?.webview.postMessage({ type: "loginStatus", payload: result });
      if (result.status === "confirmed" && result.token) {
        this.stopPolling();
        await this.api.saveToken(result.token);
        await this.onPortfolioUpdated();
      } else if (result.status === "expired") {
        this.stopPolling();
      }
    } catch (error) {
      this.stopPolling();
      await this.view?.webview.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "登录状态检查失败"
      });
    }
  }

  private stopPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
    this.pollExpiresAt = 0;
  }

  private async sendInitialState(portfolio?: Portfolio): Promise<void> {
    if (!this.api.token) {
      await this.view?.webview.postMessage({
        type: "initialState",
        payload: {
          loggedIn: false,
          demo: this.api.isDemo,
          useDefaultTextColor: this.useDefaultTextColor
        }
      });
      return;
    }

    const nextPortfolio = portfolio ?? await this.api.getPortfolio();
    await this.view?.webview.postMessage({
      type: "initialState",
      payload: {
        loggedIn: true,
        demo: this.api.isDemo,
        useDefaultTextColor: this.useDefaultTextColor,
        portfolio: nextPortfolio
      }
    });
  }

  private get useDefaultTextColor(): boolean {
    return vscode.workspace
      .getConfiguration("fundView")
      .get<boolean>("useDefaultTextColor", false);
  }

  private getHtml(webview: vscode.Webview): string {
    const root = vscode.Uri.joinPath(this.extensionUri, "webview", "dist", "client");
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(root, "assets", "index.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(root, "assets", "index.css"));
    const nonce = crypto.randomUUID().replaceAll("-", "");

    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>基金看板</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}
