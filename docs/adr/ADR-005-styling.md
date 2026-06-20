# ADR-005: Styling

Status: Accepted

Date: 2026-06-20

## Context

Phase 2 produced a full frontend prototype and a complete Precision Pacers
design system. The product now has a distinctive visual identity and reusable UI
patterns across Home, Dashboard, Activities, Activity Detail, Training Plan,
Workout Detail, AI Coach, Settings, Import and Performance.

The design system is documented in:

- `docs/pp-brand/brand-steckbrief.md`
- `docs/pp-brand/precision-pacers-brand-board.html`
- `docs/pp-brand/pp-labels.html`
- `docs/pp-brand/Precision Pacers Design System/readme.md`
- `docs/pp-brand/Precision Pacers Design System/styles.css`
- `apps/web/src/App.css`
- `apps/web/src/components/`

The styling choice needs to preserve the implemented brand instead of replacing
it with a generic UI framework.

## Decision

Use a custom CSS/token-based styling system for `pp-trainer`, implemented in
plain CSS and React components.

The source of truth for production UI is the app code:

- global tokens and page styles in `apps/web/src/App.css`
- base browser/app styles in `apps/web/src/index.css`
- reusable React components in `apps/web/src/components/`

The source of truth for brand/design documentation is the Precision Pacers
design system under `docs/pp-brand/`.

Core styling rules:

- Pacer Pink `#eb0f7a` is the primary accent.
- Ink `#161418` is reserved for strong contrast and special surfaces.
- Warm paper `#fbfbf8` is the default page stage.
- Display type uses Anton, uppercase and the fast skew motif.
- UI/body type uses Hanken Grotesk.
- Data/numbers use Space Mono.
- The brand radius is 3px for cards, buttons and labels.
- Hairline borders, dashed pink rules and structured spacing define layout.
- Sport labels, intensity labels and source labels follow the three-family
  label system.
- Product UI should stay data-dense, sharp and functional rather than
  decorative or generic SaaS.

Do not adopt Tailwind, a component framework or a design library for the
frontend unless a future ADR supersedes this decision.

Lucide or another icon library is not part of the current shipped system. If a
future feature genuinely needs icons, add them deliberately and sparsely.

## Consequences

- The app keeps a distinctive brand instead of drifting toward generic
  framework defaults.
- Styling changes should reuse existing tokens, label systems and layout
  patterns before introducing new visual language.
- CSS remains directly inspectable and easy to tune for product review.
- Component extraction should happen when a pattern is repeated and stable, not
  just because a CSS block exists.
- The UI can evolve without requiring Tailwind config, theme build steps or a
  third-party component abstraction.
- Accessibility states, focus indicators and responsive behavior must be handled
  manually and tested.
- The design system under `docs/pp-brand/` should be kept aligned with the
  production app when major UI patterns change.

## Implemented Phase 2 Patterns

- Sticky/transforming app shell navigation.
- Full homepage layout with brand imagery.
- Dashboard widgets and activity/workout cards.
- Sport, intensity, source and goal-priority labels.
- Activity detail chart tabs and interactive chart tooltips.
- Shared zone visualisation components for training-zone definitions.
- Settings controls, custom dropdowns and availability UI.
- Import pipeline and source strategy surface.
- Performance stats sections with sport-specific zones and race predictors.
- Route-level empty states for prototype review.

## Alternatives Considered

### Tailwind CSS

Rejected for now because the app already has a precise custom token system and
the required UI is more brand-specific than utility-framework-driven.

### Component libraries

Rejected for now because generic component styling would fight the Precision
Pacers visual language and likely require heavy overrides.

### CSS Modules

Still possible later for scoping if file size becomes painful, but not needed
to finalize the Phase 2/Phase 3 styling approach.
