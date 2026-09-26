"""Validate the Oxinov company platform and OxinovLMS project scaffold."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md", "AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md",
    ".env.example", ".gitignore", ".dockerignore", ".editorconfig", ".prettierrc",
    ".node-version", ".nvmrc", ".npmrc", "package.json", "pnpm-lock.yaml",
    "pnpm-workspace.yaml", "turbo.json", "eslint.config.js", "tsconfig.json",
    "scripts/validate-workspace.mjs", "devops/docker/Dockerfile", "docker-compose.yml",
    ".github/workflows/ci.yml", ".github/workflows/security.yml",
    ".github/workflows/deploy.yml", "devops/terraform/README.md",
    "devops/ansible/README.md", "devops/kubernetes/helm/oxinov/Chart.yaml",
    "devops/kubernetes/helm/oxinov/values.yaml", "devops/kubernetes/scripts/deploy.sh",
    "devops/kubernetes/scripts/bootstrap-node.sh", "devops/kubernetes/README.md",
    "devops/README.md", "devops/docker/README.md",
    "docs/00-PROJECT-BRIEF.md", "docs/01-PRD.md", "docs/02-FRD.md", "docs/03-NFR.md",
    "docs/README.md", "docs/company/PLATFORM-BLUEPRINT.md",
    "docs/company/PLATFORM-POLICIES.md", "docs/company/SUBSCRIPTION-MODEL.md",
    "docs/company/AI-IMPLEMENTATION-STRATEGY.md",
    "docs/research/README.md", "docs/research/PORTFOLIO.md",
    "docs/research/PROJECT-TEMPLATE.md",
    "docs/research/USER-CENTERED-PRODUCT-STANDARD.md",
    "docs/architecture/IDENTITY-AND-ACCESS.md",
    "docs/requirements/README.md", "docs/requirements/PLATFORM-FRD.md",
    "docs/products/README.md", "docs/products/AGRI-MARKET.md",
    "docs/products/COMMODITY-MARKET.md",
    "docs/products/JOBS.md", "docs/products/SERVICES-MARKET.md",
    "docs/architecture/ARCHITECTURE.md", "docs/architecture/TECH-STACK.md",
    "docs/architecture/COMPANY-PLATFORM-ARCHITECTURE.md",
    "docs/architecture/COMPANY-TECH-STACK.md",
    "docs/architecture/AWS-CLOUD-ARCHITECTURE.md",
    "docs/architecture/AI-PLATFORM-ARCHITECTURE.md",
    "docs/architecture/ADR.md", "docs/architecture/DATA-FLOW.md",
    "docs/architecture/INTEGRATIONS.md", "docs/architecture/SCALABILITY.md",
    "docs/design/UI-UX.md", "docs/design/USER-FLOWS.md",
    "docs/design/DESIGN-SYSTEM.md", "docs/design/BRAND.md", "docs/design/ACCESSIBILITY.md",
    "docs/data/DATABASE-DESIGN.md", "docs/data/DATA-MODEL.md",
    "docs/data/ERD.md", "docs/data/MIGRATION-STRATEGY.md",
    "docs/data/DATA-RETENTION.md", "docs/api/API-SPEC.md",
    "docs/api/AUTH.md", "docs/api/ERROR-HANDLING.md",
    "docs/api/API-VERSIONING.md", "docs/engineering/CODING-STANDARDS.md",
    "docs/engineering/PROJECT-STRUCTURE.md", "docs/engineering/GIT-WORKFLOW.md",
    "docs/engineering/COMPANY-PROJECT-STRUCTURE.md",
    "docs/engineering/TESTING-STRATEGY.md", "docs/engineering/ERROR-HANDLING.md",
    "docs/engineering/LOGGING.md", "docs/engineering/DEPENDENCY-POLICY.md",
    "docs/security/SECURITY.md", "docs/security/THREAT-MODEL.md",
    "docs/security/AI-GOVERNANCE.md",
    "docs/security/SECRETS-MANAGEMENT.md", "docs/security/PRIVACY.md",
    "docs/security/SOC.md",
    "docs/devops/DEV-SETUP.md", "docs/devops/ENVIRONMENTS.md",
    "docs/devops/CI-CD.md", "docs/devops/DEPLOYMENT.md",
    "docs/devops/OBSERVABILITY.md", "docs/devops/BACKUP-RECOVERY.md",
    "docs/devops/ROLLBACK.md", "docs/planning/ROADMAP.md",
    "docs/planning/COMPANY-PLATFORM-ROADMAP.md",
    "docs/planning/AI-IMPLEMENTATION-ROADMAP.md",
    "docs/planning/TASKS.md", "docs/planning/ACCEPTANCE-CRITERIA.md",
    "docs/planning/RISKS.md", "docs/planning/CHANGELOG.md",
    "frontend/README.md", "frontend/company-web/README.md", "frontend/platform-web/README.md",
    "frontend/products/lms-web/README.md", "frontend/web/README.md", "frontend/mobile/README.md",
    "backend/README.md", "backend/gateway/README.md", "backend/platform-api/README.md",
    "backend/workers/platform-worker/README.md", "backend/products/lms-api/README.md",
    "backend/api/README.md", "backend/worker/README.md", "backend/chat/README.md",
    "database/README.md", "database/platform/README.md", "database/products/lms/README.md",
    "database/prisma/README.md",
    "database/migrations/README.md", "database/seeds/README.md",
    "database/policies/README.md", "packages/auth/README.md", "packages/config/README.md",
    "packages/contracts/README.md", "packages/design-system/README.md",
    "packages/observability/README.md", "packages/security-events/README.md",
    "packages/testing/README.md", "packages/domain/README.md", "monitoring/README.md",
    "monitoring/prometheus/prometheus.yml",
    "monitoring/prometheus/rules/oxinov-alerts.yml",
    "monitoring/alertmanager/alertmanager.yml",
    "monitoring/grafana/provisioning/datasources/prometheus.yml",
    "monitoring/grafana/provisioning/dashboards/oxinov.yml",
    "monitoring/grafana/dashboards/platform-overview.json",
    "security/README.md", "security/ci/README.md", "security/soc/README.md",
    "security/soc/event-schema.json", "security/soc/EVENT-CATALOG.md",
    "security/soc/examples/README.md",
    "security/soc/examples/cross-tenant-access-denied.json",
    "security/soc/examples/privileged-role-change.json",
    "security/soc/examples/invalid-payment-webhook.json",
    "security/soc/detections/README.md",
    "security/soc/detections/sigma/cross-tenant-access-denied.yml",
    "security/soc/detections/sigma/privileged-role-change.yml",
    "security/soc/detections/sigma/invalid-payment-webhook.yml",
    "security/soc/runbooks/README.md",
    "security/soc/runbooks/CROSS-TENANT-ACCESS.md",
    "security/soc/runbooks/ACCOUNT-TAKEOVER.md",
    "security/soc/runbooks/PAYMENT-WEBHOOK-ABUSE.md",
    "security/soc/incidents/INCIDENT-TEMPLATE.md",
    "security/evidence/README.md", "prompts/BUILD-OXINOV-PLATFORM.md",
    "prompts/IMPLEMENT-AI-FOUNDATION.md",
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

    # Requirement IDs are unique across every FRD in the company (docs/requirements/README.md).
    all_ids: list[str] = []
    for path in [frd, *sorted((ROOT / "docs/requirements").glob("*-FRD.md"))]:
        if path.is_file():
            all_ids += re.findall(r"(?m)^\*\*(FR-[A-Z]+-\d{3,4})", path.read_text(encoding="utf-8"))
    duplicates = sorted({i for i in all_ids if all_ids.count(i) > 1})
    if duplicates:
        errors.append(f"Duplicate requirement IDs across FRDs: {duplicates}")
    numbers = [int(i.rsplit("-", 1)[1]) for i in all_ids]
    reused = sorted({n for n in numbers if numbers.count(n) > 1})
    if reused:
        errors.append(f"Requirement numbers reused across areas: {reused}")

    doc_map = ROOT / "docs/README.md"
    if doc_map.is_file():
        mapped = doc_map.read_text(encoding="utf-8")
        for doc in sorted((ROOT / "docs").rglob("*.md")):
            relative = doc.relative_to(ROOT / "docs").as_posix()
            is_redirect = doc.read_text(encoding="utf-8").startswith("# Moved")
            if relative != "README.md" and not is_redirect and f"({relative}" not in mapped:
                errors.append(f"Document not linked from docs/README.md: docs/{relative}")

    dashboard = ROOT / "monitoring/grafana/dashboards/platform-overview.json"
    if dashboard.is_file():
        try:
            json.loads(dashboard.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid Grafana dashboard JSON: {exc}")

    security_schema = ROOT / "security/soc/event-schema.json"
    if security_schema.is_file():
        try:
            schema = json.loads(security_schema.read_text(encoding="utf-8"))
            required = set(schema.get("required", []))
            expected = {"schema_version", "timestamp", "event_id", "event", "service", "environment", "reason_code"}
            if not expected.issubset(required):
                errors.append("Security event schema is missing required envelope fields")
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid security event schema JSON: {exc}")

    event_required = {"schema_version", "timestamp", "event_id", "event", "service", "environment", "reason_code"}
    forbidden_event_keys = {
        "password", "token", "secret", "cookie", "authorization", "raw_body",
        "request_body", "response_body", "private_message", "exam_answer", "prompt",
    }

    def inspect_event(value: object, path: str, found: list[str]) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key.lower() in forbidden_event_keys:
                    found.append(f"{path}.{key}")
                inspect_event(child, f"{path}.{key}", found)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                inspect_event(child, f"{path}[{index}]", found)

    for example in (ROOT / "security" / "soc" / "examples").glob("*.json"):
        try:
            event = json.loads(example.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid security event example JSON {example.relative_to(ROOT)}: {exc}")
            continue
        missing = event_required - set(event)
        if missing:
            errors.append(f"Security event example missing {sorted(missing)}: {example.relative_to(ROOT)}")
        if event.get("schema_version") != "1.0":
            errors.append(f"Security event example has wrong schema version: {example.relative_to(ROOT)}")
        forbidden: list[str] = []
        inspect_event(event, "$", forbidden)
        if forbidden:
            errors.append(f"Security event example contains prohibited fields {forbidden}: {example.relative_to(ROOT)}")

    sigma_required = ("title:", "id:", "status:", "logsource:", "detection:", "condition:", "level:")
    sigma_ids: list[str] = []
    for rule in (ROOT / "security" / "soc" / "detections" / "sigma").glob("*.yml"):
        rule_text = rule.read_text(encoding="utf-8")
        for field in sigma_required:
            if field not in rule_text:
                errors.append(f"Sigma rule missing {field} {rule.relative_to(ROOT)}")
        match = re.search(r"(?m)^id:\s*([0-9a-fA-F-]{36})\s*$", rule_text)
        if not match:
            errors.append(f"Sigma rule has no valid UUID: {rule.relative_to(ROOT)}")
        else:
            sigma_ids.append(match.group(1).lower())
        for reference in re.findall(r"(?m)^\s+-\s+(\.\./[^\s]+\.md)\s*$", rule_text):
            if not (rule.parent / reference).resolve().is_file():
                errors.append(f"Broken Sigma runbook reference: {rule.relative_to(ROOT)} -> {reference}")
    if len(sigma_ids) != len(set(sigma_ids)):
        errors.append("Sigma rules contain duplicate IDs")

    for legacy in ("apps", "infrastructure", "k8s"):
        if (ROOT / legacy).exists():
            errors.append(f"Legacy root must not return: {legacy}/")

    link_pattern = re.compile(r"(?<!!)\[[^]]+\]\(([^)]+)\)")
    for path in ROOT.glob("**/*.md"):
        parts = path.relative_to(ROOT).parts
        if "node_modules" in parts or any(part.startswith(".") for part in parts):
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
    if "security/evidence/*" not in ignored or "security/evidence/" not in docker_ignored:
        errors.append("Incident evidence must be excluded from Git and Docker build contexts")
    terraform_root = ROOT / "devops" / "terraform"
    for state in terraform_root.rglob("*.tfstate*"):
        errors.append(f"Terraform state must not be stored in Git: {state.relative_to(ROOT)}")
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    if "privileged: true" in compose:
        errors.append("Compose must not use privileged containers")
    if "devops/docker/Dockerfile" not in compose:
        errors.append("Compose application builds must use devops/docker/Dockerfile")
    for legacy_path in ("apps/", "infrastructure/observability", "./k8s/"):
        if legacy_path in compose:
            errors.append(f"Compose contains a legacy path: {legacy_path}")
    for manifest in (ROOT / "devops" / "kubernetes").glob("*.yaml"):
        if "kind: Secret" in manifest.read_text(encoding="utf-8"):
            errors.append(f"Keep literal Kubernetes Secrets out of Git: {manifest.name}")
    evidence_root = ROOT / "security" / "evidence"
    for evidence in evidence_root.iterdir():
        if evidence.name != "README.md":
            errors.append(f"Incident evidence must not be stored in Git: {evidence.relative_to(ROOT)}")
    security_workflow = (ROOT / ".github/workflows/security.yml").read_text(encoding="utf-8")
    if "aquasecurity/trivy-action@v0.36.0" not in security_workflow:
        errors.append("Security workflow must run the pinned Trivy repository scan")


def check_deploy(errors: list[str]) -> None:
    applications = {
        "frontend/web": ROOT / "frontend" / "web" / "package.json",
        "frontend/mobile": ROOT / "frontend" / "mobile" / "package.json",
        "backend/api": ROOT / "backend" / "api" / "package.json",
        "backend/worker": ROOT / "backend" / "worker" / "package.json",
        "backend/chat": ROOT / "backend" / "chat" / "package.json",
    }
    for name, manifest in applications.items():
        if not manifest.is_file():
            errors.append(f"Application source not ready: {name}/package.json")
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
