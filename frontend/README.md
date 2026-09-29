# Frontend

User-facing clients are separated by company, platform, and product responsibility:

- `company-web/` is the approved public company-site boundary.
- `platform-web/` is the approved account portal and product-launcher boundary.
- `products/` contains independently owned product web clients.
- `mobile/` contains product mobile clients only when approved.

Product web clients are named `products/<slug>-web/`; mobile clients go in `mobile/<slug>/`.
All clients call versioned APIs and must never connect
directly to PostgreSQL or contain server secrets.

## Assistant skills

Coding assistants working here follow [oxinov-frontend](../.claude/skills/oxinov-frontend/SKILL.md), [oxinov-mobile](../.claude/skills/oxinov-mobile/SKILL.md), [oxinov-branding](../.claude/skills/oxinov-branding/SKILL.md), [oxinov-accessibility](../.claude/skills/oxinov-accessibility/SKILL.md), [oxinov-seo](../.claude/skills/oxinov-seo/SKILL.md), [oxinov-testing](../.claude/skills/oxinov-testing/SKILL.md). All rules and skills: [AI knowledge](../docs/14-ai-knowledge/README.md).
