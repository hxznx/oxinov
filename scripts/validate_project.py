"""Validate the Oxinov company platform and product scaffold, documentation, and catalogs."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from doc_links import local_targets, markdown_files, unreachable_docs

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
    "docs/02-products/edu/edu-brief.md", "docs/02-products/edu/edu-prd.md", "docs/03-requirements/frd/edu-frd.md", "docs/03-requirements/nfr.md",
    "docs/README.md", "docs/01-company/platform-blueprint.md",
    "docs/01-company/platform-policies.md", "docs/01-company/subscription-model.md",
    "docs/01-company/ai-strategy.md",
    "docs/12-research/README.md", "docs/12-research/portfolio.md",
    "docs/12-research/project-template.md",
    "docs/12-research/user-centered-product-standard.md",
    "docs/04-architecture/identity-and-access.md",
    "docs/03-requirements/README.md", "docs/03-requirements/frd/platform-frd.md",
    "docs/03-requirements/frd/hr-frd.md", "docs/03-requirements/frd/market-frd.md",
    "docs/03-requirements/frd/services-market-frd.md",
    "docs/03-requirements/frd/studio-frd.md", "docs/03-requirements/frd/jp-frd.md",
    "docs/03-requirements/frd/tech-frd.md",
    "docs/02-products/README.md", "docs/02-products/market/market-charter.md",
    "docs/02-products/hr/README.md", "docs/02-products/services-market/services-market-charter.md",
    "docs/02-products/edu/edu-architecture.md", "docs/02-products/edu/edu-tech-stack.md",
    "docs/04-architecture/platform-architecture.md",
    "docs/04-architecture/tech-stack.md",
    "docs/04-architecture/cloud-architecture.md",
    "docs/04-architecture/ai-architecture.md",
    "docs/04-architecture/adr/README.md", "docs/04-architecture/data-flow.md",
    "docs/04-architecture/integrations.md", "docs/04-architecture/scalability.md",
    "docs/02-products/edu/edu-ui-ux.md", "docs/02-products/edu/edu-user-flows.md",
    "docs/07-design/design-system.md", "docs/07-design/brand.md", "docs/07-design/accessibility.md",
    "docs/05-data/database-design.md", "docs/05-data/data-model.md",
    "docs/02-products/edu/edu-erd.md", "docs/05-data/migration-strategy.md",
    "docs/05-data/data-retention.md", "docs/06-api/api-spec.md",
    "docs/06-api/api-auth.md", "docs/06-api/api-errors.md",
    "docs/06-api/api-versioning.md", "docs/08-engineering/coding-standards.md",
    "docs/08-engineering/project-structure.md", "docs/08-engineering/git-workflow.md",
    "docs/08-engineering/company-project-structure.md",
    "docs/08-engineering/testing-strategy.md", "docs/08-engineering/error-handling.md",
    "docs/08-engineering/logging.md", "docs/08-engineering/dependency-policy.md",
    "docs/09-security/security-baseline.md", "docs/09-security/threat-model.md",
    "docs/09-security/ai-governance.md",
    "docs/09-security/secrets-management.md", "docs/09-security/privacy.md",
    "docs/09-security/soc.md",
    "docs/10-devops/dev-setup.md", "docs/10-devops/environments.md",
    "docs/10-devops/ci-cd.md", "docs/10-devops/deployment.md",
    "docs/10-devops/observability.md", "docs/10-devops/backup-recovery.md",
    "docs/10-devops/rollback.md", "docs/02-products/edu/edu-roadmap.md",
    "docs/11-planning/company-roadmap.md",
    "docs/11-planning/ai-roadmap.md",
    "docs/11-planning/tasks.md", "docs/02-products/edu/edu-acceptance-criteria.md",
    "docs/11-planning/risks.md", "docs/11-planning/changelog.md",
    "frontend/README.md", "frontend/company-web/README.md", "frontend/platform-web/README.md",
    "frontend/products/lms-web/README.md", "frontend/mobile/README.md", "docs/02-products/edu/README.md",
    "backend/README.md", "backend/gateway/README.md", "backend/platform-api/README.md",
    "backend/workers/platform-worker/README.md", "backend/products/lms-api/README.md",
    "backend/products/lms-api/README.md", "backend/products/lms-worker/README.md", "backend/products/lms-chat/README.md",
    "database/README.md", "database/platform/README.md", "database/products/lms/README.md",
    "database/products/lms/prisma/README.md",
    "database/products/lms/migrations/README.md", "database/products/lms/seeds/README.md",
    "database/products/lms/policies/README.md", "packages/auth/README.md", "packages/config/README.md",
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

    frd = ROOT / "docs/03-requirements/frd/edu-frd.md"
    if frd.is_file():
        text = frd.read_text(encoding="utf-8")
        ids = re.findall(r"(?m)^\*\*(FR-[A-Z]+-\d{3,4})", text)
        if len(ids) < 55:
            errors.append(f"FRD has {len(ids)} requirement IDs; expected at least 55")

    # Requirement IDs are unique across every FRD in the company (docs/03-requirements/README.md).
    all_ids: list[str] = []
    for path in sorted((ROOT / "docs/03-requirements/frd").glob("*-frd.md")):
        if path.is_file():
            all_ids += re.findall(r"(?m)^\*\*(FR-[A-Z]+-\d{3,4})", path.read_text(encoding="utf-8"))
    duplicates = sorted({i for i in all_ids if all_ids.count(i) > 1})
    if duplicates:
        errors.append(f"Duplicate requirement IDs across FRDs: {duplicates}")
    numbers = [int(i.rsplit("-", 1)[1]) for i in all_ids]
    reused = sorted({n for n in numbers if numbers.count(n) > 1})
    if reused:
        errors.append(f"Requirement numbers reused across areas: {reused}")

    markdown = markdown_files(ROOT)
    for doc in unreachable_docs(ROOT, markdown):
        errors.append(f"Document not reachable from docs/README.md (link it from a folder index): {doc}")
    for doc in markdown:
        name = doc.rsplit("/", 1)[-1]
        if doc.startswith("docs/") and name != "README.md" and name != name.lower():
            errors.append(f"Document names under docs/ are lowercase kebab-case: {doc}")

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

    for relative in markdown:
        if relative.startswith(".claude/"):
            continue
        for target in local_targets(relative, (ROOT / relative).read_text(encoding="utf-8")):
            if not (ROOT / target).exists():
                errors.append(f"Broken link: {relative} -> {target}")


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
        "frontend/mobile": ROOT / "frontend" / "mobile" / "package.json",
        "backend/products/lms-api": ROOT / "backend" / "products" / "lms-api" / "package.json",
        "backend/products/lms-worker": ROOT / "backend" / "products" / "lms-worker" / "package.json",
        "backend/products/lms-chat": ROOT / "backend" / "products" / "lms-chat" / "package.json",
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
    # NFR-12: keep the requested project library synchronized with repository paths.
    catalog = subprocess.run([sys.executable, str(ROOT / "scripts/project_catalog.py"), "--check"], cwd=ROOT)
    if catalog.returncode:
        errors.append("Project file catalog is stale or could not be checked")
    # ADR-019: services.yaml is the one service registry; derived files and the chart must agree with it.
    services = subprocess.run([sys.executable, str(ROOT / "scripts/service_catalog.py"), "--check"], cwd=ROOT)
    if services.returncode:
        errors.append("Service catalog is inconsistent or its derived files are stale")
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
