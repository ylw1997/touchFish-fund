# Design QA

## Source visual truth

- Problem state: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-76ad0fbb-10e3-4f68-954d-616d2ddef97c.png`
- Intended default-theme appearance: `C:\Users\ylwgg\AppData\Local\Temp\codex-clipboard-5f609de9-8503-4183-9bce-1b7f2506046a.png`
- Problem-state pixels: 699 × 1641
- Target-state pixels: 822 × 1404
- State: logged-in VS Code side panel. The custom `ylw-dark-theme` made all horizontal separators nearly white, while the default dark theme kept them subtle.

## Implementation evidence

- Local preview: `http://127.0.0.1:4173/`
- Browser-rendered viewport: 699 × 1641 CSS px at device scale factor 1
- Simulated theme values: sidebar background `#1a1c22`, foreground `#abb2bf`, and an intentionally bright section-header border `#eeeeee`
- Temporary implementation capture: `C:\Users\ylwgg\AppData\Local\Temp\fund-view-ylw-theme-fixed.png`
- Temporary three-way comparison: `C:\Users\ylwgg\AppData\Local\Temp\fund-view-theme-border-comparison.png`
- Computed separator: `color-mix(in srgb, #abb2bf 10%, #1a1c22)`, rendered near `#292b32`
- Contrast against the custom-theme surface: about 1.20:1 after the fix, versus about 14.68:1 for the reproduced bad border. The default-theme reference is approximately 1.25:1.
- Temporary captures are removed after inspection to preserve the repository's no-generated-images requirement.

## Full-view comparison evidence

The three-way comparison places the reported custom-theme state, the intended default-theme state, and the fixed custom-theme simulation in one image. The before state shows high-contrast table-like rules across Tabs, summary, header, and every holding row. The fixed simulation returns those boundaries to the same low-contrast visual role as the default-theme reference.

The standalone preview uses demo data and a different text scale from the VS Code host, so typography and row-density comparisons were treated as non-authoritative. The comparison is intentionally scoped to the requested theme-token and separator behavior.

## Focused region comparison evidence

The upper account summary and first holding rows were inspected at original pixels. Their computed top and row border colors are identical and remain visually distinguishable without becoming bright rules. A separate focused artifact was unnecessary because the relevant boundaries remain readable in the combined original-resolution comparison.

## Findings

No actionable P0/P1/P2 findings remain.

- Fonts and typography: unchanged by this patch; the preview/source density difference comes from the standalone browser versus VS Code host and is outside this color-token fix.
- Spacing and layout rhythm: unchanged; the patch modifies no dimensions, padding, grid tracks, or row heights.
- Colors and visual tokens: fixed. Separators now derive from the active foreground and sidebar background at 10% strength instead of trusting a theme token that can resolve to a near-white line.
- Image quality and asset fidelity: no image assets were added or changed.
- Copy and content: unchanged.
- Interaction and accessibility: account Tabs, refresh, fixed header regions, and holding-list scrolling remain functional. The softer separators preserve section boundaries through spacing and alignment rather than high-contrast rules.

## Comparison history

1. Initial P2: custom themes could supply an overly bright `sideBarSectionHeader.border`, making every separator visually dominant.
2. Fix: replaced that direct token mapping with a theme-adaptive 10% foreground/background mix.
3. Post-fix evidence: under the reproduced custom theme, the computed row and top borders render near `#292b32` on `#1a1c22`, closely matching the default-theme reference contrast.
4. Browser verification: entered the demo account, checked the complete fixed layout, confirmed eight holding rows, and found no browser console errors.

## Primary interactions tested

- Entered the demo account from the QR login screen.
- Confirmed both account Tabs remain present.
- Confirmed the fixed summary and holdings table render under simulated custom-theme variables.
- Confirmed all relevant separators share the new adaptive token.
- Confirmed no browser console errors.

## Final result

final result: passed
