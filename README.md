# touchFish-fund

在 VS Code 侧边栏查看基金账户、持仓收益与大盘行情，不离开编辑器也能快速了解账户变化。

[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.90.0-007ACC?logo=visualstudiocode)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Publish extension](https://github.com/ylw1997/touchFish-fund/actions/workflows/publish.yml/badge.svg)](https://github.com/ylw1997/touchFish-fund/actions/workflows/publish.yml)

> 本插件是第三方开源项目，无隶属或合作关系。页面中的盘中估值、收益等数据仅供参考，不构成任何投资建议，请以基金公司最终公布的数据为准。
<img width="813" height="1185" alt="image" src="https://github.com/user-attachments/assets/5bbd51ea-9541-4f34-80c3-864dd47c15a1" />

## 功能特性

- 扫码登录养基宝账户，无需在 VS Code 内输入账号和密码
- 展示账户总资产、当日收益、收益率及更新时间
- 按账户切换并查看基金持仓
- 展示持有金额、实时估值、当日收益和持有收益
- 区分已更新收益与盘中估算收益
- 刷新数据时，金额、涨跌幅和指数数值平滑过渡
- 展示上证指数、深证成指、创业板指和沪深 300
- 一键隐藏资产及收益金额
- 在 VS Code 状态栏持续展示当前账户的当日收益和所选指数，点击即可切换指数
- 支持手动刷新和可配置的定时刷新
- 自动适配 VS Code 明暗主题
- 提供本地演示数据，方便界面开发和功能体验

## 安装

### 扩展市场

在 VS Code 扩展面板中搜索“touchFish-fund”，然后点击“安装”。

### VSIX 安装

从 [Releases](https://github.com/ylw1997/touchFish-fund/releases) 下载 `.vsix` 文件，在 VS Code 中执行：

1. 打开扩展面板。
2. 点击右上角 `…`。
3. 选择“从 VSIX 安装…”。
4. 选择下载的文件并按提示完成安装。

也可以使用命令行：

```bash
code --install-extension touchFish-fund-0.1.0.vsix
```

## 使用方法

1. 点击活动栏中的“touchFish-fund”图标。
2. 使用账户所属客户端扫描二维码。
3. 在手机端确认登录。
4. 登录成功后，插件会自动加载账户资产和基金持仓。

看板顶部可切换不同账户、手动刷新或退出登录。点击资产旁的眼睛图标可以临时隐藏金额；点击底部大盘区域可以展开或收起指数详情。

也可以通过命令面板执行：

- `touchFish-fund：扫码登录`
- `touchFish-fund：退出登录`

## 配置

打开 VS Code 设置并搜索“touchFish-fund”，即可调整以下选项：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `fundView.refreshInterval` | `60` | 收益和指数刷新间隔，单位为秒，最小 60 秒 |
| `fundView.showStatusBar` | `true` | 是否在状态栏显示当日收益和所选指数 |
| `fundView.statusBarIndexCode` | `1.000001` | 状态栏指数代码；也可以直接点击状态栏选择 |
| `fundView.useDefaultTextColor` | `false` | 使用主题默认文字颜色显示收益和涨跌；关闭时使用红涨绿跌 |
| `fundView.useDemoData` | `false` | 使用内置演示账户，不请求真实账户数据 |
| `fundView.selectedAccountId` | `0` | 当前账户 ID，由账户切换功能自动维护 |
| `fundView.token` | 空 | 登录 Token，由扫码登录流程自动写入 |

`fundView.useDemoData` 主要面向开发和界面预览。启用后，在登录页可直接进入演示账户。

## 数据与隐私

- 插件不要求输入养基宝账号或密码，登录由二维码确认流程完成。
- 账户和持仓数据由扩展宿主直接请求固定的养基宝 HTTPS 接口，Webview 不直接访问该服务。
- 项目代码中未包含统计、广告或遥测上报。
- 登录 Token 当前保存在 VS Code 全局配置 `fundView.token` 中，可能显示在用户设置 JSON 内。请勿分享包含该配置的文件或日志；使用公共设备后请及时退出登录。
- 点击退出登录会清除本地 Token，但不会注销其他设备上的会话。

## 常见问题

### 二维码过期怎么办？

二维码有效期约为 2 分钟。点击登录页的“刷新二维码”重新获取即可。

### 状态栏显示“刷新失败”

请检查网络连接和养基宝服务状态。若 Token 已失效，插件会提示重新扫码登录。

### 为什么当日收益和最终结果不同？

基金净值公布前，部分数据基于盘中估值计算。看板会用“估”标识估算收益；最终结果以基金公司公布的净值为准。

### 为什么最低只能每 60 秒刷新一次？

限制刷新频率可以减少不必要的接口请求，并降低触发服务端限流的概率。

### 如何彻底清除登录信息？

先在看板中点击退出登录，再检查 VS Code 用户设置中是否仍存在 `fundView.token`。

## 本地开发

### 环境要求

- Node.js 20 或更高版本
- pnpm 10
- VS Code 1.90 或更高版本

### 启动

```bash
git clone https://github.com/ylw1997/touchFish-fund.git
cd touchFish-fund
pnpm install
pnpm build
```

使用 VS Code 打开项目并按 `F5`，即可启动扩展开发宿主。仅开发 Webview 界面时，可以开启 `fundView.useDemoData`，避免请求真实账户。

### 常用命令

```bash
# TypeScript 检查和 Webview Lint
pnpm check

# 构建 Webview 和扩展
pnpm build

# 生成 VSIX 安装包
pnpm package
```

项目主要由两部分组成：

- `src/`：VS Code 扩展宿主、登录轮询、接口请求和数据归一化
- `webview/`：React + Ant Design 实现的侧边栏界面

## 发布

项目使用 `standard-version` 根据 Conventional Commits 自动升级版本、生成 `CHANGELOG.md`、创建 `chore(release)` 提交并打 `v*` Tag：

```bash
pnpm changelog
```

推送普通提交到 `main` 后，Release Workflow 会执行检查和构建，再自动生成版本提交与 Tag。Tag 随后触发 Publish Workflow，将同一个 VSIX 发布到 Visual Studio Marketplace、Open VSX，并创建 GitHub Release。

仓库需要配置以下 Actions Secrets：

- `GH_RELEASE_PAT`：允许向当前仓库推送 `main` 和 Tag 的 GitHub Token
- `VSCE_PAT`：Visual Studio Marketplace 发布令牌
- `OVSX_PAT`：Open VSX 发布令牌

发布前还需确保 `package.json` 中的 `publisher` 已在两个市场创建并保持同名。版本号由 `standard-version` 自动维护，不要手动修改。

## 贡献

欢迎通过 [Issues](https://github.com/ylw1997/touchFish-fund/issues) 报告问题或提出建议。提交 Pull Request 前，请先运行：

```bash
pnpm check
pnpm build
```

提交问题时请尽量提供 VS Code 版本、插件版本、复现步骤和错误提示。请勿上传 Token、账户名称、持仓金额等敏感信息。

## 开源许可

本项目基于 [MIT License](LICENSE) 开源。
