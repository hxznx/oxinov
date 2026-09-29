# 09 · Security

How Oxinov protects accounts, tenants, data, and the platform, and how it detects and responds to security events. Detection rules, event schemas, and incident runbooks live in [`security/`](../../security/README.md).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

| Document | Purpose |
| --- | --- |
| [Security baseline](security-baseline.md) | Controls every service and change must meet |
| [Secure development standard](secure-development-standard.md) | Security principles, the request pipeline, and each common risk (OWASP-style) mapped to its Oxinov control, code location, test, and gap |
| [Threat model](threat-model.md) | Assets, threats, and mitigations |
| [Privacy](privacy.md) | Personal data handling, export, and deletion |
| [Secrets management](secrets-management.md) | Where secrets live and how they are rotated |
| [AI governance](ai-governance.md) | Rules for every AI feature, model, prompt, and evaluation |
| [Security operations (SOC)](soc.md) | Security events, detections, and incident handling |

## Assistant skills

Coding assistants working here follow [oxinov-authentication-sessions](../../.claude/skills/oxinov-authentication-sessions/SKILL.md), [oxinov-access-control](../../.claude/skills/oxinov-access-control/SKILL.md), [oxinov-secure-input-output](../../.claude/skills/oxinov-secure-input-output/SKILL.md), [oxinov-secrets-and-crypto](../../.claude/skills/oxinov-secrets-and-crypto/SKILL.md), [oxinov-security-operations](../../.claude/skills/oxinov-security-operations/SKILL.md), [oxinov-security](../../.claude/skills/oxinov-security/SKILL.md), [oxinov-ai-feature](../../.claude/skills/oxinov-ai-feature/SKILL.md), [oxinov-observability](../../.claude/skills/oxinov-observability/SKILL.md). All rules and skills: [AI knowledge](../14-ai-knowledge/README.md).
