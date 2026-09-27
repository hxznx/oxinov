"""Generate and check everything derived from the service catalog, services.yaml (ADR-019).

    python scripts/service_catalog.py           regenerate the derived files
    python scripts/service_catalog.py --check   fail when they are stale or the catalog disagrees with the repo
    python scripts/service_catalog.py --list    print every service

Derived files: devops/scripts/services.sh (sourced by the delivery scripts), .github/CODEOWNERS, and
docs/08-engineering/service-catalog.md. Standard library only, so it runs anywhere Python 3.9+ does.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = "services.yaml"
SHELL_OUT = "devops/scripts/services.sh"
OWNERS_OUT = ".github/CODEOWNERS"
DOCS_OUT = "docs/08-engineering/service-catalog.md"
CHART_VALUES = "devops/kubernetes/helm/oxinov/values.yaml"
CHART_PRODUCTION = "devops/kubernetes/helm/oxinov/values-production.yaml"
TIERS = {"critical", "core", "growth"}
KINDS = {"api", "web", "worker", "identity", "job"}
FIELDS = {"product", "kind", "owner", "path", "build", "inputs", "helm_tag", "workload", "port", "host"}
NAME = re.compile(r"^[a-z][a-z0-9-]*$")


# --- A small reader for the plain block YAML the catalog uses -------------------------------------
def _scalar(text: str):
    text = text.strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        return text[1:-1]
    if text.startswith("["):
        if not text.endswith("]"):
            raise ValueError(f"unterminated list: {text}")
        inner = text[1:-1].strip()
        return [_scalar(item) for item in inner.split(",")] if inner else []
    if text in {"true", "false"}:
        return text == "true"
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    if text in {"none", "null", "~", ""}:
        return None
    return text


def _strip_comment(line: str) -> str:
    quote = None
    for i, char in enumerate(line):
        if char in "\"'" and quote in (None, char):
            quote = None if quote else char
        elif char == "#" and quote is None and (i == 0 or line[i - 1] in " \t"):
            return line[:i]
    return line


def parse(text: str) -> dict:
    """Parse nested mappings of scalars and flow lists (`[a, b]`); anything else is an error."""
    root: dict = {}
    stack: list[tuple[int, dict]] = [(-1, root)]
    for number, raw in enumerate(text.splitlines(), 1):
        line = _strip_comment(raw).rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        if "\t" in line[:indent] or indent % 2:
            raise ValueError(f"{CATALOG}:{number}: indent with two spaces")
        match = re.fullmatch(r"([A-Za-z0-9_-]+):(?:\s+(.*))?", line.strip())
        if not match:
            raise ValueError(f"{CATALOG}:{number}: expected `key: value` (block lists and anchors are not supported)")
        while stack[-1][0] >= indent:
            stack.pop()
        parent = stack[-1][1]
        key, value = match.group(1), match.group(2)
        if key in parent:
            raise ValueError(f"{CATALOG}:{number}: duplicate key {key}")
        if value is None:
            parent[key] = {}
            stack.append((indent, parent[key]))
        else:
            parent[key] = _scalar(value)
    return root


def load(root: Path = ROOT) -> dict:
    return parse((root / CATALOG).read_text(encoding="utf-8"))


# --- Derived files --------------------------------------------------------------------------------
def tag_var(service: str) -> str:
    return "TAG_" + service.upper().replace("-", "_")


def inputs_regex(inputs: list[str]) -> str:
    # POSIX ERE escaping only: Python's re.escape also escapes "-", which grep warns about.
    def ere(path: str) -> str:
        return re.sub(r"([.^$*+?()\[\]{}|\\])", r"\\\1", path)

    parts = [ere(p) if p.endswith("/") else ere(p) + "$" for p in inputs]
    return "^(" + "|".join(parts) + ")"


def _case(name: str, arms: list[tuple[str, str]], fallback: str) -> list[str]:
    lines = [f"{name}() {{", "  case $1 in"]
    lines += [f"    {pattern}) {body} ;;" for pattern, body in arms]
    lines += [f"    *) {fallback} ;;", "  esac", "}"]
    return lines


def render_shell(catalog: dict) -> str:
    services = catalog["services"]
    names = list(services)
    workloads = [s["workload"] for s in services.values() if s["workload"]]
    node = [n for n, s in services.items() if s["build"].get("node")]
    lines = [
        "#!/usr/bin/env bash",
        "# Generated from services.yaml by scripts/service_catalog.py. Do not edit; edit services.yaml.",
        "# Sourced by the release planner, deploy.sh, the deploy workflow, rehearse-local.sh and oxctl.",
        "# shellcheck disable=SC2034",
        "",
        "# Every built image, in release manifest order.",
        f"CATALOG_SERVICES=({' '.join(names)})",
        "# Kubernetes Deployments in the chart (plus postgres, which the chart owns directly).",
        f"CATALOG_WORKLOADS=({' '.join(workloads)})",
        "",
        "# Extended regular expression of the paths an image is built from.",
        *_case("catalog_inputs", [(n, f"echo '{inputs_regex(s['inputs'])}'") for n, s in services.items()],
               'echo "unknown service $1" >&2; return 1'),
        "",
        "# Succeeds when the image is rebuilt on shared Node.js workspace changes.",
        *_case("catalog_node", [("|".join(node), "return 0")] if node else [], "return 1"),
        "",
        "# Prints: <dockerfile> <context> <target or -> <trivyignore or ->",
        *_case("catalog_build", [
            (n, "echo '{} {} {} {}'".format(s["build"]["dockerfile"], s["build"].get("context", "."),
                                             s["build"].get("target") or "-", s["build"].get("trivyignore") or "-"))
            for n, s in services.items()], 'echo "unknown service $1" >&2; return 1'),
        "",
        "# Release manifest variable -> Helm value holding it.",
        *_case("catalog_helm_key", [(tag_var(n), f"echo '{s['helm_tag']}'") for n, s in services.items()]
               + [("DEPLOYED_SHA", "echo 'global.deployedSha'")], "return 1"),
        "",
        'catalog_tag_var() { echo "TAG_$(echo "$1" | tr \'a-z-\' \'A-Z_\')"; }',
        "",
    ]
    return "\n".join(lines)


def render_owners(catalog: dict) -> str:
    services = catalog["services"]
    default = catalog["default_owner"]
    rows = [("*", default), ("/services.yaml", default)]
    rows += sorted({(f"/{s['path']}/", s["owner"]) for s in services.values()})
    width = max(len(p) for p, _ in rows)
    lines = ["# Generated from services.yaml by scripts/service_catalog.py. Do not edit; edit services.yaml.",
             "# Later lines win: each service folder is reviewed by its owner, everything else by the default owner.", ""]
    lines += [f"{p.ljust(width)}  {o}" for p, o in rows]
    return "\n".join(lines) + "\n"


def render_docs(catalog: dict) -> str:
    services = catalog["services"]
    lines = [
        "# Service catalog", "",
        "[Project library](../../PROJECT-LIBRARY.md) · [Product register](../02-products/README.md) · [Production runbook](../../devops/kubernetes/README.md)", "",
        "Every deployable service, generated from [`services.yaml`](../../services.yaml) by `python scripts/service_catalog.py`.",
        "Edit the catalog, not this page. The image of each service is `oxinov/<service>` in Amazon ECR.", "",
        "| Service | Product | Kind | Source | Build target | Workload | Port | Public host | Owner |",
        "| --- | --- | --- | --- | --- | --- | ---: | --- | --- |",
    ]
    for name, s in services.items():
        host = f"`{s['host']}.oxinov.com`" if s["host"] else "internal"
        target = s["build"].get("target") or f"`{s['build']['dockerfile']}`"
        lines.append(f"| `{name}` | {s['product']} | {s['kind']} | [{s['path']}](../../{s['path']}/) | {target} | "
                     f"{s['workload'] or 'none'} | {s['port'] or '-'} | {host} | {s['owner']} |")
    lines += [
        "", "## Adding a service", "",
        "Run `oxctl new-service <product> <api|web|worker>` (try `--dry-run` first). It creates `<product>-<kind>` on",
        "its product shelf ([placement rules](project-structure.md)) as a small standard-library Node.js service with",
        "health endpoints and a test, adds its Dockerfile stage, `services.yaml` entry and Helm entry (with network",
        "access: web public, API from the product's web app, worker none), and regenerates this page. The product",
        "needs a record in `docs/02-products/<product>/` first, so the release gate still applies. Then:", "",
        "1. `pnpm install` to add the package to the lockfile, and run its test.",
        "2. Plan and apply the starter Terraform stack: it creates the ECR repository from the catalog (and add a",
        "   public host to `var.hosts` for its DNS record).",
        "3. Push. The release planner builds and deploys the new image like every other service.",
        "4. Grow the code into the product stack (NestJS with `@oxinov/server-kit`, or Next.js) as it needs more.", "",
        "`python scripts/service_catalog.py --check` (run by `scripts/validate_project.py` in CI) fails when a derived",
        "file is stale, a path, Dockerfile target or chart entry is missing, or a port or host disagrees with the chart.", "",
        "## Sharing the node (ADR-022)", "",
        "Every product runs on the one k3s node. Each chart workload has a `priority` tier: `critical` (PostgreSQL,",
        "Keycloak, mail relay), `core` (live products and the platform, the default), or `growth` (new products; new",
        "services start here and move to core at launch). Under memory pressure Kubernetes preempts and evicts lower",
        "tiers first. `--check` also fails when the production memory requests of all workloads exceed",
        "`memoryBudgetMi` in the chart values, so crowding shows up in CI instead of in production.", "",
    ]
    return "\n".join(lines)


OUTPUTS = {SHELL_OUT: render_shell, OWNERS_OUT: render_owners, DOCS_OUT: render_docs}


# --- Consistency with the repository --------------------------------------------------------------
def _chart_services(root: Path) -> dict[str, dict]:
    """Port and host of each `services:` entry in the chart values (two-space keys under `services:`)."""
    found: dict[str, dict] = {}
    current = None
    in_services = False
    for line in (root / CHART_VALUES).read_text(encoding="utf-8").splitlines():
        if re.match(r"^\S", line):
            in_services = line.startswith("services:")
            current = None
            continue
        if not in_services:
            continue
        key = re.match(r"^  ([a-z0-9-]+):\s*$", line)
        if key:
            current = found.setdefault(key.group(1), {})
            continue
        field = re.match(r"^    (port|host):\s*(.*?)\s*(#.*)?$", line)
        if current is not None and field:
            current[field.group(1)] = _scalar(field.group(2))
    return found


def _mebibytes(text: str) -> int:
    match = re.fullmatch(r"(\d+)(Mi|Gi)", text.strip())
    if not match:
        raise ValueError(f"memory must be written in Mi or Gi, not {text!r}")
    return int(match.group(1)) * (1024 if match.group(2) == "Gi" else 1)


def memory_plan(root: Path = ROOT) -> dict:
    """Production memory requests per workload (ADR-022): chart defaults with the production overrides.

    Returns {"budget": Mi, "workloads": {name: (replicas, request Mi, priority)}}; one-off Jobs (migrate,
    backup) are counted because a release or the nightly dump runs beside everything else.
    """
    values = (root / CHART_VALUES).read_text(encoding="utf-8").splitlines()
    budget = next((int(m.group(1)) for line in values if (m := re.match(r"^memoryBudgetMi:\s*(\d+)", line))), 0)
    workloads: dict[str, list] = {}
    section, current = None, None
    for line in values:
        if re.match(r"^\S", line):
            section, current = line.split(":")[0], None
            if section in {"postgres", "migrations", "backup"}:
                current = workloads.setdefault(section, [1, 0, "critical" if section == "postgres" else "core"])
            continue
        key = re.match(r"^  ([a-z0-9-]+):\s*$", line)
        if section == "services" and key:
            current = workloads.setdefault(key.group(1), [1, 0, "core"])
            continue
        if current is None:
            continue
        if (m := re.match(r"^\s+replicas:\s*(\d+)", line)) and section == "services":
            current[0] = int(m.group(1))
        elif (m := re.match(r"^\s+priority:\s*([a-z]+)", line)) and section == "services":
            current[2] = m.group(1)
        elif m := re.match(r"^\s+requests:\s*\{[^}]*memory:\s*([0-9]+(?:Mi|Gi))", line):
            current[1] = _mebibytes(m.group(1))
    for line in (root / CHART_PRODUCTION).read_text(encoding="utf-8").splitlines():
        if (m := re.match(r"^  ([a-z0-9-]+):\s*\{[^}]*replicas:\s*(\d+)", line)) and m.group(1) in workloads:
            workloads[m.group(1)][0] = int(m.group(2))
    return {"budget": budget, "workloads": {name: tuple(w) for name, w in workloads.items()}}


def check_memory(root: Path = ROOT) -> list[str]:
    plan = memory_plan(root)
    errors = []
    for name, (_, request, tier) in plan["workloads"].items():
        if tier not in TIERS:
            errors.append(f"{CHART_VALUES}: {name} priority {tier!r} must be one of {sorted(TIERS)}")
        if request <= 0:
            errors.append(f"{CHART_VALUES}: {name} needs resources.requests.memory")
    total = sum(replicas * request for replicas, request, _ in plan["workloads"].values())
    if not plan["budget"]:
        errors.append(f"{CHART_VALUES}: memoryBudgetMi is missing")
    elif total > plan["budget"]:
        errors.append(f"production memory requests are {total} Mi, over the {plan['budget']} Mi node budget (ADR-022): "
                      "shrink a workload or get the owner's approval to scale out")
    return errors


def check(catalog: dict, root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    if catalog.get("version") != 1:
        errors.append("services.yaml: version must be 1")
    if not str(catalog.get("default_owner", "")).startswith("@"):
        errors.append("services.yaml: default_owner must be a GitHub handle such as @name")
    services = catalog.get("services") or {}
    chart = _chart_services(root)
    helm_tags: dict[str, str] = {}
    for name, s in services.items():
        where = f"services.yaml {name}"
        if not NAME.match(name):
            errors.append(f"{where}: name must be lowercase letters, digits and hyphens")
        missing = FIELDS - set(s)
        extra = set(s) - FIELDS
        if missing or extra:
            errors.append(f"{where}: missing {sorted(missing)} / unknown {sorted(extra)}")
            continue
        if s["product"] != "platform" and not (root / "docs/02-products" / s["product"] / "README.md").is_file():
            errors.append(f"{where}: product {s['product']} has no record at docs/02-products/{s['product']}/README.md")
        if s["kind"] not in KINDS:
            errors.append(f"{where}: kind must be one of {sorted(KINDS)}")
        if not str(s["owner"]).startswith("@"):
            errors.append(f"{where}: owner must be a GitHub handle")
        if not (root / s["path"]).is_dir():
            errors.append(f"{where}: path {s['path']} does not exist")
        build = s["build"] if isinstance(s["build"], dict) else {}
        dockerfile = root / str(build.get("dockerfile", ""))
        if not dockerfile.is_file():
            errors.append(f"{where}: dockerfile {build.get('dockerfile')} does not exist")
        elif build.get("target") and not re.search(rf"(?im)^FROM\s+\S+\s+AS\s+{re.escape(build['target'])}\s*$", dockerfile.read_text(encoding="utf-8")):
            errors.append(f"{where}: {build['dockerfile']} has no `AS {build['target']}` stage")
        if not (root / str(build.get("context", "."))).is_dir():
            errors.append(f"{where}: build context {build.get('context')} does not exist")
        if build.get("trivyignore") and not (root / build["trivyignore"]).is_file():
            errors.append(f"{where}: trivyignore {build['trivyignore']} does not exist")
        if not isinstance(build.get("node"), bool):
            errors.append(f"{where}: build.node must be true or false")
        if not isinstance(s["inputs"], list) or not s["inputs"]:
            errors.append(f"{where}: inputs must be a non-empty [list]")
        else:
            for path in s["inputs"]:
                target = root / path.rstrip("/")
                if not (target.is_dir() if path.endswith("/") else target.is_file()):
                    errors.append(f"{where}: input {path} does not exist")
        if s["helm_tag"] in helm_tags:
            errors.append(f"{where}: helm_tag {s['helm_tag']} is also used by {helm_tags[s['helm_tag']]}")
        helm_tags[s["helm_tag"]] = name
        workload = s["workload"]
        if workload:
            if s["helm_tag"] != f"services.{workload}.tag":
                errors.append(f"{where}: helm_tag must be services.{workload}.tag for workload {workload}")
            if workload not in chart:
                errors.append(f"{where}: chart {CHART_VALUES} has no services.{workload} entry")
            else:
                if chart[workload].get("port") != s["port"]:
                    errors.append(f"{where}: port {s['port']} but the chart says {chart[workload].get('port')}")
                if (chart[workload].get("host") or None) != s["host"]:
                    errors.append(f"{where}: host {s['host']} but the chart says {chart[workload].get('host') or 'none'}")
    listed = {s["workload"] for s in services.values() if isinstance(s, dict) and s.get("workload")}
    for workload in sorted(set(chart) - listed):
        errors.append(f"{CHART_VALUES}: services.{workload} is not registered in services.yaml")
    errors += check_memory(root)
    return errors


def main() -> int:
    return main_with(None)


def main_with(argv: list[str] | None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--list", action="store_true", help="print every service and exit")
    args = parser.parse_args(argv)
    try:
        catalog = load()
    except ValueError as error:
        print(f"ERROR: {error}")
        return 1
    if args.list:
        print(f"{'SERVICE':<14} {'PRODUCT':<9} {'KIND':<9} {'PORT':<5} {'HOST':<18} SOURCE")
        for name, s in catalog["services"].items():
            host = f"{s['host']}.oxinov.com" if s["host"] else "internal"
            print(f"{name:<14} {s['product']:<9} {s['kind']:<9} {str(s['port'] or '-'):<5} {host:<18} {s['path']}")
        return 0
    errors = check(catalog)
    for relative, render in OUTPUTS.items():
        expected = render(catalog) if not errors else None
        path = ROOT / relative
        if expected is None:
            continue
        if args.check:
            if not path.is_file() or path.read_text(encoding="utf-8") != expected:
                errors.append(f"{relative} is stale. Run: python scripts/service_catalog.py")
        else:
            path.write_text(expected, encoding="utf-8", newline="\n")
            print(f"Updated {relative}")
    for error in errors:
        print(f"ERROR: {error}")
    if not errors and args.check:
        plan = memory_plan()
        total = sum(r * m for r, m, _ in plan["workloads"].values())
        print(f"Service catalog is consistent ({len(catalog['services'])} services; production memory requests "
              f"{total} of {plan['budget']} Mi)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
