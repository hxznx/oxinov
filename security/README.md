# Security operations

This area contains executable security engineering and SOC assets. Product security policy remains under `docs/09-security/`; operational rules, schemas, runbooks, and incident templates live here.

```text
security/
  ci/                 CI scanning policy
  soc/
    event-schema.json normalized application security-event contract
    detections/sigma/ portable detection rules
    runbooks/         analyst response procedures
    incidents/        incident record template
  evidence/           local evidence instructions; actual evidence is ignored by Git
```

Application uptime and performance remain under `monitoring/`. Security events are sent to a separately access-controlled SIEM. See [SOC design](../docs/09-security/soc.md).

## Assistant skills

Coding assistants working here follow [oxinov-security-operations](../.claude/skills/oxinov-security-operations/SKILL.md), [oxinov-secure-input-output](../.claude/skills/oxinov-secure-input-output/SKILL.md), [oxinov-security](../.claude/skills/oxinov-security/SKILL.md), [oxinov-observability](../.claude/skills/oxinov-observability/SKILL.md). All rules and skills: [AI knowledge](../docs/14-ai-knowledge/README.md).
