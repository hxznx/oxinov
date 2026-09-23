"""Validate the documentation-first Oxinov project scaffold."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md", "AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md",
    ".env.example", ".gitignore", ".dockerignore", ".editorconfig", ".prettierrc",
    "eslint.config.js", "tsconfig.json", "Dockerfile", "docker-compose.yml",
    ".github/workflows/ci.yml", ".github/workflows/security.yml",
    ".github/workflows/deploy.yml", "infrastructure/terraform/README.md",
    "infrastructure/ansible/README.md", "k8s/deployment.yaml",
    "k8s/service.yaml", "k8s/ingress.yaml", "k8s/configmap.yaml",
    "docs/00-PROJECT-BRIEF.md", "docs/01-PRD.md", "docs/02-FRD.md", "docs/03-NFR.md",
    "docs/architecture/ARCHITECTURE.md", "docs/architecture/TECH-STACK.md",
    "docs/architecture/ADR.md", "docs/architecture/DATA-FLOW.md",
    "docs/architecture/INTEGRATIONS.md", "docs/architecture/SCALABILITY.md",
    "docs/design/UI-UX.md", "docs/design/USER-FLOWS.md",
    "docs/design/DESIGN-SYSTEM.md", "docs/design/ACCESSIBILITY.md",
    "docs/data/DATABASE-DESIGN.md", "docs/data/DATA-MODEL.md",
    "docs/data/ERD.md", "docs/data/MIGRATION-STRATEGY.md",
    "docs/data/DATA-RETENTION.md", "docs/api/API-SPEC.md",
    "docs/api/AUTH.md", "docs/api/ERROR-HANDLING.md",
    "docs/api/API-VERSIONING.md", "docs/engineering/CODING-STANDARDS.md",
    "docs/engineering/PROJECT-STRUCTURE.md", "docs/engineering/GIT-WORKFLOW.md",
    "docs/engineering/TESTING-STRATEGY.md", "docs/engineering/ERROR-HANDLING.md",
    "docs/engineering/LOGGING.md", "docs/engineering/DEPENDENCY-POLICY.md",
    "docs/security/SECURITY.md", "docs/security/THREAT-MODEL.md",
    "docs/security/SECRETS-MANAGEMENT.md", "docs/security/PRIVACY.md",
    "docs/devops/DEV-SETUP.md", "docs/devops/ENVIRONMENTS.md",
    "docs/devops/CI-CD.md", "docs/devops/DEPLOYMENT.md",
    "docs/devops/OBSERVABILITY.md", "docs/devops/BACKUP-RECOVERY.md",
    "docs/devops/ROLLBACK.md", "docs/planning/ROADMAP.md",
    "docs/planning/TASKS.md", "docs/planning/ACCEPTANCE-CRITERIA.md",
    "docs/planning/RISKS.md", "docs/planning/CHANGELOG.md",
    "infrastructure/observability/prometheus/prometheus.yml",
    "infrastructure/observability/prometheus/rules/oxinov-alerts.yml",
    "infrastructure/observability/alertmanager/alertmanager.yml",
    "infrastructure/observability/grafana/provisioning/datasources/prometheus.yml",
    "infrastructure/observability/grafana/provisioning/dashboards/oxinov.yml",
    "infrastructure/observability/grafana/dashboards/platform-overview.json",
]


def check_docs(errors: list[str]) -> None:
    for relative in REQUIRED:
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"Missing: {relative}")
        elif not path.read_bytes().strip():
            errors.append(f"Empty: {relative}")

    frd = ROOT / "docs/02-FRD.md"
    if frd.is_file():
        text = frd.read_text(encoding="utf-8")
        ids = re.findall(r"(?m)^\*\*(FR-[A-Z]+-\d{3,4})", text)
        if len(ids) < 55:
            errors.append(f"FRD has {len(ids)} requirement IDs; expected at least 55")
        if len(ids) != len(set(ids)):
            errors.append("FRD contains duplicate requirement IDs")

    link_pattern = re.compile(r"(?<!!)\[[^]]+\]\(([^)]+)\)")
    for path in ROOT.glob("**/*.md"):
        if any(part.startswith(".") for part in path.relative_to(ROOT).parts):
            continue
        for target in link_pattern.findall(path.read_text(encoding="utf-8")):
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            local = target.split("#", 1)[0].replace("%20", " ")
            if local and not (path.parent / local).exists():
                errors.append(f"Broken link: {path.relative_to(ROOT)} -> {target}")


def check_security(errors: list[str]) -> None:
    ignored = (ROOT / ".gitignore").read_text(encoding="utf-8")
    docker_ignored = (ROOT / ".dockerignore").read_text(encoding="utf-8")
    if ".env\n" not in ignored or ".env\n" not in docker_ignored:
        errors.append(".env must be excluded from Git and Docker build contexts")
    if (ROOT / "terraform.tfstate").exists():
        errors.append("Terraform state must not be stored in the repository root")
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    if "privileged: true" in compose:
        errors.append("Compose must not use privileged containers")
    for manifest in (ROOT / "k8s").glob("*.yaml"):
        if "kind: Secret" in manifest.read_text(encoding="utf-8"):
            errors.append(f"Keep literal Kubernetes Secrets out of Git: {manifest.name}")


def check_deploy(errors: list[str]) -> None:
    for app in ["web", "api", "worker", "chat", "mobile"]:
        if not (ROOT / "apps" / app / "package.json").is_file():
            errors.append(f"Application source not ready: apps/{app}/package.json")
    errors.append("Deployment target and release credentials are not configured")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--security", action="store_true")
    parser.add_argument("--deploy", action="store_true")
    args = parser.parse_args()
    errors: list[str] = []
    check_docs(errors)
    if args.security:
        check_security(errors)
    if args.deploy:
        check_deploy(errors)
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        return 1
    print(f"Project scaffold valid: {len(REQUIRED)} required files, 55+ FRD requirements")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
