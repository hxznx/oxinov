"""Scaffold a new service on the golden path (ADR-019). Run through `oxctl new-service`:

    python scripts/new_service.py <product> <api|web|worker> [--port N] [--host NAME] [--dry-run]

Creates <product>-<kind>: a minimal standard-library Node.js service with health endpoints, a README and a
test on its product shelf; a Dockerfile stage; the services.yaml entry; and the Helm values entry. Then
regenerates the catalog's derived files and checks everything agrees. The product must already have a
record at docs/products/<product>/README.md (or be `platform`), so the release gate still applies.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import service_catalog
from service_catalog import CATALOG, CHART_VALUES, NAME, ROOT

DOCKERFILE = "devops/docker/Dockerfile"
KINDS = ("api", "web", "worker")
FIRST_PORT = 4300


def source_path(product: str, kind: str, name: str) -> str:
    if product == "platform":
        return {"api": f"backend/{name}", "web": f"frontend/{name}", "worker": f"backend/workers/{name}"}[kind]
    return f"frontend/products/{name}" if kind == "web" else f"backend/products/{name}"


def free_port(catalog: dict) -> int:
    used = {s["port"] for s in catalog["services"].values() if s.get("port")}
    port = FIRST_PORT
    while port in used:
        port += 1
    return port


def plan(root: Path, product: str, kind: str, port: int | None, host: str | None) -> dict:
    catalog = service_catalog.parse((root / CATALOG).read_text(encoding="utf-8"))
    name = f"{product}-{kind}"
    problems = []
    if not NAME.match(product):
        problems.append("product must be a lowercase slug")
    if product != "platform" and not (root / "docs/products" / product / "README.md").is_file():
        problems.append(f"no product record at docs/products/{product}/README.md: record and approve the product first")
    if name in catalog["services"]:
        problems.append(f"{name} is already in {CATALOG}")
    path = source_path(product, kind, name)
    existing = [p for p in (root / path).glob("*") if p.name != "README.md"] if (root / path).is_dir() else []
    if existing:
        problems.append(f"{path} already has files; scaffold only into a new or README-only folder")
    port = port or free_port(catalog)
    if kind == "web":
        host = host or product
    elif host:
        problems.append("only web services get a public host")
    if problems:
        raise SystemExit("new-service: " + "\n new-service: ".join(problems))
    web = f"{product}-web"
    return {
        "name": name, "product": product, "kind": kind, "path": path, "port": port, "host": host,
        "owner": catalog["default_owner"],
        # Public web services take traffic from the ingress; an API from its product's web app; a worker from no one.
        "allow_from": ["public"] if kind == "web" else [web] if kind == "api" else [],
    }


# --- Files --------------------------------------------------------------------------------------
def source_files(root: Path, p: dict) -> dict[str, str]:
    name, port = p["name"], p["port"]
    main = f"""// {name}: scaffolded by `oxctl new-service` (ADR-019). Standard library only; grow it into the
// product's stack (NestJS with @oxinov/server-kit for APIs, Next.js for web) when it needs more.
import {{ createServer }} from 'node:http';

export function handle(request, response) {{
  if (request.url === '/health/live' || request.url === '/health/ready') {{
    response.writeHead(200, {{ 'content-type': 'application/json' }});
    response.end(JSON.stringify({{ status: 'ok', service: '{name}' }}));
    return;
  }}
  response.writeHead(404, {{ 'content-type': 'application/json' }});
  response.end(JSON.stringify({{ error: 'not_found' }}));
}}

// Start only when run directly (`node src/main.mjs`), not when a test imports it.
if (process.argv[1]?.endsWith('main.mjs')) {{
  const port = Number(process.env.PORT ?? {port});
  const server = createServer(handle).listen(port, () => console.log(JSON.stringify({{ level: 'info', message: 'listening', port }})));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
}}
"""
    test = f"""import assert from 'node:assert/strict';
import {{ createServer }} from 'node:http';
import {{ test }} from 'node:test';
import {{ handle }} from './main.mjs';

test('answers health checks and 404 otherwise', async () => {{
  const server = createServer(handle).listen(0);
  const {{ port }} = server.address();
  try {{
    const live = await fetch(`http://127.0.0.1:${{port}}/health/live`);
    assert.equal(live.status, 200);
    assert.equal((await live.json()).service, '{name}');
    assert.equal((await fetch(`http://127.0.0.1:${{port}}/nope`)).status, 404);
  }} finally {{
    server.close();
  }}
}});
"""
    package = f"""{{
  "name": "@oxinov/{name}",
  "version": "0.1.0",
  "private": true,
  "description": "{p['kind'].capitalize()} service for {p['product']}, scaffolded by oxctl new-service",
  "license": "UNLICENSED",
  "type": "module",
  "engines": {{
    "node": ">=22"
  }},
  "scripts": {{
    "start": "node src/main.mjs",
    "test": "node --test src/main.test.mjs"
  }}
}}
"""
    public = f"`https://{p['host']}.oxinov.com`" if p["host"] else "internal only"
    up = "../" * len(p["path"].split("/"))
    readme = f"""# {name}

{p['kind'].capitalize()} service for `{p['product']}`, registered in [`services.yaml`]({up}services.yaml) and listed in the
[service catalog]({up}docs/engineering/SERVICE-CATALOG.md). Scaffolded by `oxctl new-service`.

| | |
| --- | --- |
| Port | {port} (`/health/live`, `/health/ready`) |
| Public address | {public} |
| Image | `oxinov/{name}`, Dockerfile stage `{name}` |
| Callers | {', '.join(p['allow_from']) or 'none (worker)'} |

Run locally with `node src/main.mjs` and test with `pnpm --filter @oxinov/{name} test`.
Before the first deploy: plan and apply the starter Terraform stack (ECR repository{', DNS for the host' if p['host'] else ''}),
then push. Grow the code into the product stack and update this README with its requirements.
"""
    files = {f"{p['path']}/src/main.mjs": main, f"{p['path']}/src/main.test.mjs": test, f"{p['path']}/package.json": package}
    if not (root / p["path"] / "README.md").is_file():
        files[f"{p['path']}/README.md"] = readme
    return files


def catalog_entry(p: dict) -> str:
    host = p["host"] or "none"
    return f"""
  {p['name']}:
    product: {p['product']}
    kind: {p['kind']}
    owner: "{p['owner']}"
    path: {p['path']}
    build:
      dockerfile: {DOCKERFILE}
      target: {p['name']}
      node: false
    inputs: [{p['path']}/]
    helm_tag: services.{p['name']}.tag
    workload: {p['name']}
    port: {p['port']}
    host: {host}
"""


def chart_entry(p: dict) -> str:
    allow = f"    allowFrom: [{', '.join(p['allow_from'])}]\n" if p["allow_from"] else ""
    return f"""  {p['name']}:
    image: oxinov/{p['name']}
    tag: ""
    port: {p['port']}
    replicas: 1
    host: {'"' + p['host'] + '"' if p['host'] else '""'}
    healthPath: /health/live
    readyPath: /health/ready
{allow}    env:
      NODE_ENV: production
      PORT: "{p['port']}"
    resources:
      requests: {{ cpu: 5m, memory: 32Mi }}
      limits: {{ memory: 96Mi }}
"""


def docker_stage(p: dict) -> str:
    return f"""
# --- {p['name']}: scaffolded by `oxctl new-service`; Node.js standard library only ------------------------
FROM runtime AS {p['name']}
WORKDIR /app
COPY {p['path']}/package.json ./package.json
COPY {p['path']}/src/ ./src/
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE {p['port']}
CMD ["node", "src/main.mjs"]
"""


def insert_chart_entry(values: str, entry: str) -> str:
    """Add the entry at the end of the top-level `services:` mapping."""
    lines = values.splitlines(keepends=True)
    start = next(i for i, line in enumerate(lines) if line.startswith("services:"))
    end = next((i for i in range(start + 1, len(lines)) if lines[i].strip() and not lines[i].startswith(" ") and not lines[i].startswith("#")), len(lines))
    while end > start + 1 and not lines[end - 1].strip():
        end -= 1
    return "".join(lines[:end]) + entry + "".join(lines[end:])


def apply(root: Path, p: dict) -> list[str]:
    changed = []
    for relative, text in source_files(root, p).items():
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8", newline="\n")
        changed.append(relative)
    catalog = root / CATALOG
    catalog.write_text(catalog.read_text(encoding="utf-8").rstrip("\n") + "\n" + catalog_entry(p), encoding="utf-8", newline="\n")
    values = root / CHART_VALUES
    values.write_text(insert_chart_entry(values.read_text(encoding="utf-8"), chart_entry(p)), encoding="utf-8", newline="\n")
    dockerfile = root / DOCKERFILE
    dockerfile.write_text(dockerfile.read_text(encoding="utf-8").rstrip("\n") + "\n" + docker_stage(p), encoding="utf-8", newline="\n")
    return changed + [CATALOG, CHART_VALUES, DOCKERFILE]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("product")
    parser.add_argument("kind", choices=KINDS)
    parser.add_argument("--port", type=int)
    parser.add_argument("--host", help="public subdomain for a web service (default: the product slug)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    p = plan(ROOT, args.product, args.kind, args.port, args.host)
    print(f"Service {p['name']} ({p['kind']}) at {p['path']}, port {p['port']}, "
          f"{'host ' + p['host'] + '.oxinov.com' if p['host'] else 'internal'}")
    if args.dry_run:
        print("Dry run: nothing written.")
        return 0
    for relative in apply(ROOT, p):
        print(f"  wrote {relative}")
    status = service_catalog.main_with([])  # regenerate derived files
    if status == 0:
        status = service_catalog.main_with(["--check"])
    if status:
        return status
    print(f"""
Next:
  1. pnpm install                  (adds @oxinov/{p['name']} to the lockfile)
  2. pnpm --filter @oxinov/{p['name']} test
  3. Plan and apply the starter Terraform stack: ECR repository oxinov/{p['name']}{' and DNS for ' + p['host'] + '.oxinov.com (add it to var.hosts)' if p['host'] else ''}
  4. Commit and push; the next green main builds and deploys it.""")
    return 0


if __name__ == "__main__":
    sys.exit(main())
