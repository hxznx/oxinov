# DevOps

Deployment and infrastructure automation lives here:

- `docker/` contains application image definitions.
- `kubernetes/` contains future cluster manifests.
- `terraform/` contains future cloud infrastructure definitions.
- `ansible/` contains future host configuration.

The root `docker-compose.yml` remains the convenient local orchestration entry point. GitHub Actions workflow files stay in `.github/workflows/` because GitHub only executes workflows from that location; their behavior is documented under `docs/10-devops/`.

## Assistant skills

Coding assistants working here follow [oxinov-cicd](../.claude/skills/oxinov-cicd/SKILL.md), [oxinov-docker](../.claude/skills/oxinov-docker/SKILL.md), [oxinov-kubernetes](../.claude/skills/oxinov-kubernetes/SKILL.md), [oxinov-terraform](../.claude/skills/oxinov-terraform/SKILL.md), [oxinov-aws](../.claude/skills/oxinov-aws/SKILL.md), [oxinov-ansible](../.claude/skills/oxinov-ansible/SKILL.md), [oxinov-server](../.claude/skills/oxinov-server/SKILL.md), [oxinov-scaling](../.claude/skills/oxinov-scaling/SKILL.md). All rules and skills: [AI knowledge](../docs/14-ai-knowledge/README.md).
