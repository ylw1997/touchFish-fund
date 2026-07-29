# Design QA

**Source visual truth**

- Path: `C:\Users\ylwgg\.codex\attachments\66784823-9a65-4860-ba32-46f665267b54\image-1.png`
- Source pixels: 772 × 1422.
- Comparison crop: y=74..1264，移除原应用顶部账户 Tab、底部指数栏和 TabBar；裁剪后 772 × 1190，归一化为 390 × 601。

**Implementation evidence**

- Login screenshot: `D:\test\fund-view\qa-login-cdp.png`
- Final portfolio screenshot: `D:\test\fund-view\qa-portfolio-final.png`
- Side-by-side comparison: `D:\test\fund-view\qa-comparison-final.png`
- Viewport / CSS size: 390 × 844.
- Implementation pixels: 390 × 844.
- Density normalization: CDP device metrics set to deviceScaleFactor=1；截图为 1 CSS px = 1 image px。
- State: standalone preview demo login，数据内容与参考图保持同类口径；生产 Webview 使用相同组件并改由扩展宿主传入养基宝数据。

## Findings

No actionable P0/P1/P2 findings remain.

- Fonts and typography: 使用 VS Code 字体变量和系统中文回退；账户总额、收益数字、基金名称、小字说明的层级清楚，数字使用 tabular figures，截断不会挤压右侧列。
- Spacing and layout rhythm: 总览、三列表头和持仓列表结构与参考图一致；底部 TabBar 按需求删除；64px 持仓行在 390px 宽侧栏内可完整展示 8 条数据。
- Colors and tokens: 正收益使用红色、负收益使用绿色，符合参考图和国内基金语义；背景、边框、正文和次级文字映射 VS Code 主题变量。
- Image and icon fidelity: 页面无需要复刻的内容图片；操作图标来自 Ant Design Icons，二维码由本地二维码组件渲染。VS Code 活动栏使用用户提供的 `股票.svg`。
- Copy and content: “账户资产 / 当日收益 / 当日估值 / 持有收益”与参考图信息口径一致，并明确保留“更新”与估值来源。
- Responsive behavior: 390px 侧栏无横向溢出；三列网格计算宽度为 167.09px / 86.64px / 96.55px。名称使用省略号，右侧金额和比率保持完整。
- Accessibility and interaction: 刷新、退出、隐藏资产按钮均有可访问名称；二维码页有状态区域；资产隐藏/恢复和退出登录已实际点击验证。
- Browser verification: 登录页、演示登录、持仓页、隐藏/显示资产、退出登录均通过；浏览器控制台错误为 0。

## Comparison history

1. Initial comparison: P2 — 78px 持仓行比参考图偏松，8 条持仓超出目标首屏密度。
2. Fix: 行高收紧到 64px，垂直 padding 从 12px 调整为 8px，名称行高调整为 18px。
3. Post-fix evidence: `qa-comparison-final.png` 显示三列对齐、数字层级、8 条持仓密度均已达到目标；无新的 P0/P1/P2。

## Focused region comparison

完整视图已在 390px 宽度下保证基金名称、金额、估值、板块、持有收益与收益率全部清晰可读；同一张并排证据可直接检查全部密集表格列，因此无需额外裁剪局部图。

## Primary interactions tested

- 扫码登录页自动创建二维码。
- 点击“先体验演示账户”进入持仓看板。
- 点击隐藏资产，汇总金额变为掩码；点击显示资产恢复。
- 点击退出登录，返回二维码登录页。
- 检查浏览器错误日志：0 errors。

**Final result**

final result: passed
