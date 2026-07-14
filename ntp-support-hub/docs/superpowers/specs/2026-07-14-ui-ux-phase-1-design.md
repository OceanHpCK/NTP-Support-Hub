# UI/UX Phase 1 Design

## Goal

Upgrade the NTP Support Hub interface toward a bright, clean, professional technical SaaS style. Phase 1 establishes the shared visual direction, upgrades the main shell and dashboard, and uses PolyWeld Butt Fusion as the first polished module template.

## Scope

Phase 1 covers:

- Shared visual language for common cards, panels, buttons, inputs, badges, metric cards, callouts, and focus states using existing Tailwind utilities.
- AppShell and Sidebar-level presentation where needed to make the product feel cleaner and more professional.
- Dashboard module cards and hero area.
- PolyWeld Pro Butt Fusion screen, including the input panel, chart panel, result panel, process steps, and the welding temperature recommendation card.
- Build, refresh `server/public`, deploy Cloudflare Worker, and verify `/polyweld` production output.

Phase 1 does not cover:

- Full redesign of every calculator module.
- Formula or business logic changes.
- New UI component libraries.
- New routing, authentication, database, or API behavior.
- Reworking the standalone `/polyweld-pro` folder unless it is affected by the main build output.

## Visual Direction

The chosen style is bright, clean, and technical:

- Primary background: light slate/white surfaces.
- Primary accent: technical blue with cyan/emerald support accents.
- Text hierarchy: dark slate headings, medium slate body copy, muted slate helper copy.
- Cards: white or very light surfaces with subtle borders and soft shadows.
- Radius: moderate, professional rounding; avoid overly playful pill-heavy layouts except for badges.
- Motion: restrained hover, focus, and transition states.
- Density: more compact and useful than a marketing page, but with enough spacing for readability.

## Shared UI Patterns

Common controls should use consistent patterns across touched screens:

- Inputs: clear labels, visible border, strong focus ring, compact helper/error text.
- Buttons: clear primary action style, hover and active state, icon when useful.
- Segmented controls: active segment with white/blue state and subtle shadow.
- Badges: small status indicators for standards, units, public access, warnings, and recommended ranges.
- Metric cards: label, large value, small unit, optional secondary note.
- Warning callouts: amber background/border, non-blocking, direct copy.
- Error states: red border and red helper text.

## AppShell And Sidebar

The shell should feel like a working dashboard:

- Use a lighter main background with subtle depth.
- Keep the sidebar stable and easy to scan.
- Active nav item should be obvious without being visually heavy.
- Mobile header should remain simple and usable.
- Do not change navigation paths or module access logic.

## Dashboard

The dashboard should become a professional module launcher:

- Keep a concise hero with product name and purpose.
- Module cards should have consistent height, icon block, title, description, and action affordance.
- Public modules should show a clean status badge instead of emoji text.
- Cards should use restrained hover lift and border accent.
- Keep the existing registry-driven architecture.

## PolyWeld Butt Fusion Template

PolyWeld Butt Fusion becomes the reference template for calculator modules:

- Top header: compact, technical, with standard badges such as ISO 21307 and DVS 2207-11.
- Left input panel: cleaner grouping, better labels, consistent controls, visible editable surface pressure field.
- Chart card: polished header, clearer subtitle, softer grid and chart presentation.
- Results area: modern metric cards with strong number hierarchy.
- Temperature card: make `200 - 230 °C` prominent and make `Tối ưu: 210 - 220 °C` a high-contrast badge/pill so it is immediately visible.
- Process steps: clearer timeline/cards with numbered steps and better spacing.
- Preserve all existing formulas and values.

## Copy And Encoding

Any touched user-facing Vietnamese copy must be restored to readable UTF-8 text, including:

- `Thông số đầu vào`
- `Áp suất bề mặt`
- `Giá trị đã khác mức khuyến nghị cho vật liệu này. Hãy kiểm tra tiêu chuẩn và thông số nhà sản xuất trước khi hàn.`
- `Nhiệt độ hàn`
- `Tối ưu: 210 - 220 °C`
- PolyWeld headings, chart labels, result labels, and process descriptions.

No intentionally mojibake text should remain in the touched UI files.

## Implementation Constraints

- Use existing React, TypeScript, Vite, Tailwind CSS, lucide-react, and recharts dependencies.
- Do not add a UI framework.
- Keep changes scoped to shared shell/dashboard files and PolyWeld Butt Fusion files for Phase 1.
- Keep formulas unchanged.
- Preserve accessibility basics: focus states, semantic labels, readable contrast, and mobile usability.
- Do not use decorative background blobs or overly ornamental elements.

## Verification

Verification must include:

1. `npm run build` succeeds.
2. Source search confirms required visible copy exists in touched files.
3. `server/public` is refreshed from `dist`.
4. Cloudflare Worker deploy succeeds.
5. Production `/polyweld` returns HTTP 200.
6. Production bundle referenced by `/polyweld` contains `Áp suất bề mặt`, `Nhiệt độ hàn`, and `Tối ưu: 210 - 220 °C`.

## Completion Criteria

Phase 1 is complete when:

- Dashboard and shell feel visually consistent with the selected bright technical SaaS style.
- PolyWeld Butt Fusion has a professional calculator layout and the welding temperature recommendation is clearly visible.
- Existing PolyWeld calculations and editable surface pressure behavior still work.
- Build and Cloudflare production verification pass.
