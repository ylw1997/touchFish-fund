# 基金看板

一个紧凑的 VS Code 基金持仓侧边栏。扫码登录后展示账户资产、当日收益和持仓明细，并每分钟刷新状态栏收益。

## 本地开发

```bash
pnpm install
pnpm build
```

按 `F5` 启动扩展开发宿主。默认直连养基宝 HTTPS 接口；仅在界面开发时可打开 `fundView.useDemoData` 使用内置演示账户。

## 养基宝接口

插件默认请求 `https://browser-plug-api.yangjibao.com`，在扩展宿主内按养基宝协议生成 `Request-Time` 与 `Request-Sign`。实际调用：

- `GET /qr_code`：创建二维码
- `GET /qr_code_state/:id`：每 3 秒轮询扫码状态，最长 2 分钟
- `GET /user_account`：读取账户
- `GET /account_collect`：读取总资产和当日收益
- `GET /fund_hold?account_id=:id`：读取并归一化各账户持仓

扫码成功后的 token 会按需求写入 VS Code 全局配置 `fundView.token`。这意味着它会显示在用户设置 JSON 中；如后续允许更安全的实现，建议迁移到 VS Code SecretStorage。

## 自动发布

每次推送 `main` 分支，GitHub Actions 会构建、打包，并依次发布到 Visual Studio Marketplace 和 Open VSX。仓库需配置：

- `VSCE_PAT`：Azure DevOps Personal Access Token
- `OVSX_PAT`：Open VSX Access Token

首次发布前还需确保 `package.json` 的 `publisher` 已分别在两个市场创建，并保持同名。
