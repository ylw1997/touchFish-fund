# Design QA

## Source visual truth

- Path: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-01ddae6d-4bc2-457e-8d15-000572bfbc83.png`
- Source pixels: 690 × 891
- Target state: logged-in dark VS Code side panel
- Requested deltas: remove the Webview logout control, remove related-board content, and place per-fund today profit below realtime valuation.

## Implementation evidence

- Local preview: `http://localhost:4173/`
- Browser-rendered viewport: 1280 × 720 CSS px at device scale factor 1
- Temporary implementation capture: `C:\Users\ylwgg\AppData\Local\Temp\fund-view-qa-latest.png`
- Temporary combined comparison: `C:\Users\ylwgg\AppData\Local\Temp\fund-view-qa-comparison.png`
- Temporary captures were removed after inspection to preserve the repository's no-generated-images requirement.
- Focused DOM evidence:
  - top action buttons: `刷新`
  - table headers: `基金 / 持有金额`, `实时估值`, `持有收益`
  - holding row children: 3
  - related-board elements: 0
  - holding row height: 64px
  - document overflow: hidden
  - holding-list overflow-y: auto

## Findings

No actionable P0/P1/P2 findings remain.

- Fonts and typography: VS Code theme fonts and numeric tabular figures remain unchanged. Realtime percentage and today profit form a clear two-line numeric hierarchy.
- Spacing and layout rhythm: holdings are reduced from four columns to three while retaining 64px rows. The removed column width is redistributed between fund name, realtime valuation, and holding profit.
- Colors and visual tokens: semantic profit colors and the optional default-text-color setting are preserved.
- Image quality and asset fidelity: this change introduces no image assets. Ant Design icons remain in use.
- Copy and content: related-board text is absent. Today profit appears below realtime valuation and keeps the `估` marker until actual data is available.
- Interaction and accessibility: the Webview header exposes only the labelled refresh button. The single remaining logout action is the VS Code view-title command outside the Webview.
- Fixed layout: Tabs, account summary, and three-column header remain fixed; only the holdings list scrolls.

## Comparison history

1. Before this pass, the Webview duplicated the VS Code logout action and the holdings table had separate today-profit and realtime-valuation columns.
2. Removed the inner logout button and `LogoutOutlined` dependency.
3. Removed the separate today-profit column and all rendered board content.
4. Moved actual-or-estimated today profit below realtime valuation, preserving `已更新` and `估` states.
5. Browser verification confirmed one top action button, three aligned data columns, no board nodes, 64px rows, and isolated list scrolling.

## Primary interactions tested

- Entered the demo account from the QR login screen.
- Confirmed both account Tabs remain available.
- Confirmed the Webview header contains refresh only.
- Confirmed updated funds show actual today profit without `估`.
- Confirmed non-updated funds show estimated today profit with `估`.
- Confirmed the fixed top regions and scrollable holdings structure remain intact.

## Final result

final result: passed
