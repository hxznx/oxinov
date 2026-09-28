# @oxinov/design-system

Shared Oxinov design tokens and brand assets for every web app. Specifications live in the [brand system](../../docs/07-design/brand.md) and [design system](../../docs/07-design/design-system.md); `src/tokens.ts` implements them and must change together with those documents.

## Use in an app

```ts
import '@oxinov/design-system/tokens.css'; // CSS custom properties, dark default + Daylight theme
import { themes, brandAssets } from '@oxinov/design-system';
```

```css
.panel {
  background: var(--ox-color-surface);
  color: var(--ox-color-text);
  clip-path: var(--ox-cut-md);
}
.panel:focus-visible { box-shadow: var(--ox-focus-ring); }
```

- Theme: dark by default. Set `data-theme="light"` or `data-theme="dark"` on `<html>` to override the device setting.
- Reduced motion: the generated CSS turns off animation and transitions when the device requests it.
- Logo files: `@oxinov/design-system/brand/<file>` (see `brandAssets`). Never redraw or recolor the logo.
- Fonts: apps self-host Orbitron, Rajdhani, Inter, Noto Sans Devanagari, and JetBrains Mono; the tokens only name the families.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm --filter @oxinov/design-system build` | Compile TypeScript, generate `dist/tokens.css`, copy brand assets |
| `pnpm --filter @oxinov/design-system test` | Contrast checks (every text token at least WCAG AA 4.5:1 on its backgrounds) and generated-CSS checks |

The contrast test is the automated check required by FR-SITE-2102; a token change that makes text unreadable fails the build.

## Assistant skills

Coding assistants working here follow [oxinov-branding](../../.claude/skills/oxinov-branding/SKILL.md), [oxinov-frontend](../../.claude/skills/oxinov-frontend/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
