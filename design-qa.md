# Design QA

**Source visual truth**

- Path: `C:\Users\ylwgg\.codex\attachments\66784823-9a65-4860-ba32-46f665267b54\image-1.png`
- Source pixels: 772 × 1422.
- Comparison crop: y=74..1264，移除原应用顶部账户 Tab、底部指数栏和 TabBar；裁剪后 772 × 1190，归一化为 390 × 601。
- Top Tabs reference: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-a0a7b8ea-709c-4041-be32-6a1e4ec37315.png`，705 × 798；重点对照 y=58..140 的 Ant Design Tabs、选中态和毛玻璃背景。
- Bottom market reference: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-aab3d91d-e09d-479f-a70a-658953401d9b.png`，567 × 177；重点对照固定底栏、标题、指数卡片和横向布局。
- Profit reference: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-987d4e35-5f18-4246-b411-aa61eb62a359.png`，274 × 186；用户文字要求覆盖截图中的双行形式，收益金额与小号百分比需改为同一行。
- Simple Tabs reference: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-f8aa59f1-61aa-45ca-ac98-6d6c70818382.png`，300 × 81；使用朴素文字、选中色和下划线，不增加标签块或装饰。
- Index arrow reference: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-4db87361-9779-478e-ad0a-c05a98fbc9cb.png`，726 × 123；用户明确修正交互语义为收起向上、展开向下。
- Four-column holdings reference: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-2a89cad6-ea7a-477e-ad2a-ddebc8cdfa26.png`，729 × 1371；按 2× 密度归一化为 365 × 686，重点对照“当日收益 / 实时估值 / 持有收益”四列结构、64px 持仓行和已更新状态。

**Implementation evidence**

- Login screenshot: `D:\test\fund-view\qa-login-cdp.png`
- Final portfolio screenshot: `D:\test\fund-view\qa-portfolio-final.png`
- Own-account screenshot: `D:\test\fund-view\qa-account-own.png`
- Read-only secondary-account screenshot: `D:\test\fund-view\qa-account-fish.png`
- Refresh loading screenshot: `D:\test\fund-view\qa-refresh-loading.png`
- Expanded market screenshot: `D:\test\fund-view\qa-market-expanded.png`
- Compact market screenshot: `D:\test\fund-view\qa-market-compact.png`
- Market comparison: `D:\test\fund-view\qa-market-comparison.png`
- Sticky compact screenshot: `D:\test\fund-view\qa-sticky-compact.png`
- Sticky expanded screenshot: `D:\test\fund-view\qa-sticky-expanded.png`
- Sticky focused comparison: `D:\test\fund-view\qa-sticky-comparison.png`
- Inline profit screenshot: `D:\test\fund-view\qa-profit-inline.png`
- Inline profit comparison: `D:\test\fund-view\qa-profit-inline-comparison.png`
- Per-fund estimated profit screenshot: `D:\test\fund-view\qa-realtime-profit.png`
- Board-restored screenshot: `D:\test\fund-view\qa-board-restored.png`
- Four-column screenshot: `D:\test\fund-view\qa-four-columns.png`
- Four-column narrow screenshot: `D:\test\fund-view\qa-four-columns-narrow.png`
- Four-column normalized screenshot: `D:\test\fund-view\qa-four-columns-365.png`
- Four-column comparison: `D:\test\fund-view\qa-four-columns-comparison.png`
- Simple Tabs and arrows comparison: `D:\test\fund-view\qa-simple-tabs-arrows-comparison.png`
- Side-by-side comparison: `D:\test\fund-view\qa-comparison-final.png`
- Viewport / CSS size: 原主视图 390 × 844；本轮固定布局回归 567 × 500。
- Implementation pixels: 原主视图 390 × 844；本轮截图 567 × 500。
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
- Account separation: “航天员”和“小鱼哥”使用独立账户标签；切换后分别显示 8 条与 3 条演示持仓，资产和当日收益均独立替换，没有合并口径。
- Refresh feedback: 手动刷新与账户切换均出现“刷新中”浮层，刷新图标同步旋转且按钮在请求期间禁用。
- Market indices: 底部指数区域默认使用 38px 单行收起态；展开后使用 112px 横向卡片显示上证、深证、创业板及沪深 300。与用户提供的展开/收起截图并排检查后，无溢出遮挡。
- Fixed glass surfaces: 顶部账户切换和底部指数均固定在视口边缘，复用 TouchFish 的 `editor-background 50% + saturate(180%) blur(15px)` 毛玻璃参数；滚动到 248px 后顶部仍为 0–48px、底部仍紧贴 500px 视口边缘。
- Inline profit: 当日收益金额和 10px 百分比处于同一 flex 行并按基线对齐；300px 窄侧栏中金额 x=155.13..236.62、百分比 x=242.62..273.14，无重叠、换行或横向溢出。
- Simple Tabs: 账户切换使用 Ant Design `Tabs size="small"` 的默认文字、选中色和下划线，仅保留固定栏所需的尺寸与左右留白，没有额外标签背景、圆角或动画。
- Index arrows: 收起状态显示向上箭头提示可展开；展开状态的“收起指数”按钮显示向下箭头。两种状态均实际点击验证。
- Per-fund estimated profit: “盘中估算”列第一行显示估算涨跌幅，第二行显示 `估 ±金额`；无有效估值时两行均为 `—`。金额按 `持有份额 ×（估算净值 − 最近正式净值）` 计算，并使用 title 明确“并非最终收益”。
- Related board: “盘中估算”列第三行继续显示关联板块；没有关联板块时不渲染额外占位，长名称使用省略号并可悬停查看完整文本。
- Four-column holdings: 持仓区改为“基金 / 持有金额、当日收益、实时估值、持有收益”四列；当正式净值日期为中国时区当天时，以正式持仓市值和实际涨跌幅计算当日收益并显示“已更新”，未更新时显示 `—`。实时估值列保留估算涨跌幅和关联板块。

## Comparison history

1. Initial comparison: P2 — 78px 持仓行比参考图偏松，8 条持仓超出目标首屏密度。
2. Fix: 行高收紧到 64px，垂直 padding 从 12px 调整为 8px，名称行高调整为 18px。
3. Post-fix evidence: `qa-comparison-final.png` 显示三列对齐、数字层级、8 条持仓密度均已达到目标；无新的 P0/P1/P2。
4. Account-separation regression: 移除多账户合并，顶部增加独立账户标签；`qa-account-own.png` 与 `qa-account-fish.png` 证明两组资产、收益和持仓分别渲染。最终无新的 P0/P1/P2。
5. Status and market polish: 移除当日收益标题左侧刷新图标，增加当日收益率、刷新 Loading 和可折叠指数区；`qa-market-comparison.png` 对照展开/收起参考图，未发现新的 P0/P1/P2。
6. Sticky-layout comparison: P2 — 原账户切换使用自绘按钮且随页面滚动，指数区仅位于文档末尾。
7. Fix: 账户切换替换为 Ant Design `Tabs`，顶部和底部统一使用 TouchFish 毛玻璃参数并固定定位；增加 48px 顶部内边距和随指数状态变化的底部占位。
8. Post-fix evidence: `qa-sticky-comparison.png` 同图对照 Tabs 与指数参考；在 567 × 500 视口滚动至底部后，展开指数从 y=380 固定到 y=500，最后持仓结束于 y=362.74，未遮挡。无新的 P0/P1/P2。
9. Profit-line comparison: P2 — 当日收益金额和百分比原先分成两行，不符合用户要求。
10. Fix: 增加 `.summary-profit-line` 单行 flex 容器，金额保留主字号，百分比缩小为 10px 并固定在金额右侧。
11. Post-fix evidence: `qa-profit-inline-comparison.png` 对照目标区域和实现；300 × 500 视口下两项处于同一水平组合，页面 `scrollWidth` 未超过视口。无新的 P0/P1/P2。
12. Tabs / arrow / fund-profit comparison: P2 — Tabs 样式覆盖过多、指数箭头语义相反，单只基金仅显示估算涨跌幅而没有估算收益金额。
13. Fix: Tabs 改回 Ant Design 小尺寸默认样式；互换收起/展开箭头；新增可选 `todayProfit`，仅在持仓接口存在盘中估值时计算并展示估算当日收益。
14. Post-fix evidence: `qa-simple-tabs-arrows-comparison.png` 同图对照朴素 Tabs 和收起箭头；`qa-realtime-profit.png` 显示单只基金估算收益。567px 与 300px 视口均无横向溢出，浏览器错误日志为 0。无新的 P0/P1/P2。
15. Board restoration: P2 — 新增估算收益时替换了原板块副信息。
16. Fix and post-fix evidence: 在估算收益下方恢复板块行，无板块时省略；`qa-board-restored.png` 显示估算涨跌幅、估算收益和板块同时存在，浏览器错误日志为 0。无新的 P0/P1/P2。
17. Four-column redesign: P2 — 将估算收益与板块挤在同一列会产生三行或截断，信息层级不稳定。
18. Fix: 参考养基宝截图新增独立“当日收益”列；实时估值列只显示估算涨跌幅和板块，基金与持有金额恢复两行结构。正式净值当天更新时才计算并显示当日收益。
19. Post-fix evidence: `qa-four-columns-comparison.png` 以 365 × 686 同尺寸并排对照参考图和实现；567px 视口四列宽度为 195.26 / 90.61 / 106.22 / 112.47px，300px 视口无横向溢出，持仓行保持 64px，浏览器错误日志为 0。无新的 P0/P1/P2。
20. Day-profit fallback: 正式净值尚未更新时，“当日收益”列改为显示实时估算收益；正式净值更新后自动替换为实际当日收益，“实时估值”列继续保留估值百分比和板块。
21. Estimate marker: 未更新基金的估算收益金额前增加弱化的“估”标识；正式收益更新后标识自动移除，金额仍保持单行。
22. Updated-first ordering and spacing: 具有正式当日收益的“已更新”基金稳定排到持仓列表顶部；四列表头和持仓行的常规列间距由 8px 增至 12px，窄侧栏使用 5px，缓解基金名称与当日收益拥挤。
23. Post-fix evidence: `qa-updated-first-spacing-comparison.png` 将用户截图的 690px 内容区与实现按相同尺寸并排比较；实现第一行带“已更新”，前两列实测间距 12px。300px 视口间距为 5px、行高 64px、无横向溢出，浏览器错误日志为 0。无新的 P0/P1/P2。
24. Fixed summary and header: 按用户标注区域将账户 Tabs、账户资产汇总和四列表头固定在顶部，页面本身禁用滚动，仅 `.holding-list` 作为中间弹性区域滚动；底部指数仍固定，并在展开时自动压缩列表高度。690 × 700 视口下页面滚动量始终为 0，列表从 190px 到 661.43px 独立滚动，顶部三段坐标保持不变；指数展开后列表底部调整为 580px。浏览器错误日志为 0。无新的 P0/P1/P2。

## Focused region comparison

`qa-sticky-comparison.png` 将两张用户参考图的目标区域与实现截图放入同一张证据：上排对照 Tabs 选中态、间距和半透明背景，下排对照展开指数的标题、卡片、数值层级和固定底栏。主题明暗差异来自 VS Code 当前预览主题，组件结构和主题变量映射一致。

`qa-profit-inline-comparison.png` 聚焦当日收益区域。参考图提供字体层级，用户文字指令明确将百分比从下方移到金额右侧；实现保留金额主视觉，并以更小字号紧邻显示收益率。

`qa-simple-tabs-arrows-comparison.png` 聚焦账户 Tabs 与底部指数摘要。Tabs 保留参考图的简单文字/下划线结构；箭头方向按用户文字指令覆盖截图状态。`qa-realtime-profit.png` 作为完整视图证据，检查盘中估算收益的排版、颜色和缺失状态。

`qa-four-columns-comparison.png` 将 729 × 1371 的参考图按 2× 密度归一化为 365 × 686，与同 CSS 视口实现并排比较。四列表头、已更新当日收益、估值涨跌幅/板块和持有收益的层级一致；扩展保留既有顶部汇总和固定指数栏，属于已确认产品约束。

`qa-updated-first-spacing-comparison.png` 聚焦最新排序与列间距反馈。左侧为用户截图的插件内容区，右侧为同宽实现；更新项被提升到列表首位，基金名称与当日收益之间增加了明确留白。

## Primary interactions tested

- 扫码登录页自动创建二维码。
- 点击“先体验演示账户”进入持仓看板。
- 点击隐藏资产，汇总金额变为掩码；点击显示资产恢复。
- 点击退出登录，返回二维码登录页。
- 在“航天员”和“小鱼哥”间往返切换，验证选中态、账户标题、资产、收益和持仓数量同步变化。
- 点击刷新，验证“刷新中”状态可见且完成后自动消失。
- 点击指数单行摘要展开四张指数卡片，再点击收起按钮恢复单行状态。
- 在 567 × 500 视口滚动 248px，验证顶部 Tabs 和底部指数位置不变；展开指数后滚动至最大 347px，验证最后一条持仓完整显示在底栏上方。
- 在 300 × 500 窄侧栏验证当日收益金额和百分比保持单行，并确认页面无横向溢出。
- 点击指数摘要验证收起态向上、展开态向下，再点击收起恢复。
- 检查 5 条有盘中估值的演示持仓显示估算收益金额，3 条无有效估值的持仓保持 `—`，并在 300px 视口确认三列无横向溢出。
- 检查“纳斯达克100、量化、中证人工智能、中证新能源”等板块与估算收益同时显示；无板块基金不出现第三个空占位。
- 验证四列表头与数据列对齐；净值已更新基金显示“已更新”和实际当日收益，未更新基金显示“估”标识与实时估算收益，仅无有效估值时显示 `—`。
- 验证“已更新”基金排序在估算基金之前；基金列与当日收益列之间保留清晰间距。
- 在 567 × 700、365 × 686、300 × 500 三个视口检查四列布局，持仓行均保持 64px 且无页面横向溢出。
- 在 690 × 700 视口滚动持仓列表至底部，验证页面 `scrollY=0`，Tabs、账户资产、表头和底部指数坐标均保持不变；展开指数后验证仅列表可用高度缩小。
- 检查浏览器错误日志：0 errors。

**Final result**

final result: passed
