"""Tests for the service catalog reader, generators and consistency checks (ADR-019)."""
from __future__ import annotations

import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

import service_catalog
from service_catalog import check, inputs_regex, load, parse, render_owners, render_shell

ROOT = Path(__file__).resolve().parents[1]
# The PATH lookup, not Windows' default search, which finds the WSL stub before Git Bash.
BASH = shutil.which("bash") or "bash"


class ParseTests(unittest.TestCase):
    def test_nested_mappings_scalars_lists_and_comments(self):
        data = parse(
            "version: 1  # schema\n"
            "owner: \"@team # not a comment\"\n"
            "services:\n"
            "  api:\n"
            "    port: 4000\n"
            "    host: none\n"
            "    node: true\n"
            "    inputs: [a/, b.json]\n"
        )
        self.assertEqual(data["version"], 1)
        self.assertEqual(data["owner"], "@team # not a comment")
        self.assertEqual(data["services"]["api"], {"port": 4000, "host": None, "node": True, "inputs": ["a/", "b.json"]})

    def test_rejects_unsupported_yaml(self):
        for text in ("services:\n  - api\n", "a:\n   b: 1\n", "a: 1\na: 2\n", "a: [1, 2\n"):
            with self.subTest(text=text), self.assertRaises(ValueError):
                parse(text)


class GenerateTests(unittest.TestCase):
    def test_inputs_regex_matches_folders_as_prefixes_and_files_exactly(self):
        pattern = inputs_regex(["backend/x-api/", "security/event-schema.json"])
        self.assertEqual(pattern, r"^(backend/x-api/|security/event-schema\.json$)")

    def test_shell_library_answers_like_the_catalog(self):
        catalog = load()
        with tempfile.TemporaryDirectory() as directory:
            library = Path(directory) / "services.sh"
            library.write_text(render_shell(catalog), encoding="utf-8", newline="\n")
            script = (
                "source ./services.sh; "
                'echo "${CATALOG_SERVICES[*]}"; catalog_helm_key TAG_LMS_API; catalog_build keycloak; '
                'catalog_node backup || echo "backup not node"; '
                'echo backend/products/edu-api/src/main.ts | grep -Eq "$(catalog_inputs lms-api)" && echo matched'
            )
            out = subprocess.run([BASH, "-c", script], cwd=directory, capture_output=True, text=True, check=True).stdout.splitlines()
        self.assertEqual(out[0].split(), list(catalog["services"]))
        self.assertEqual(out[1], "services.edu-api.tag")
        self.assertEqual(out[2], "devops/keycloak/Dockerfile devops/keycloak - devops/keycloak/.trivyignore")
        self.assertEqual(out[3:], ["backup not node", "matched"])

    def test_codeowners_puts_the_default_owner_first(self):
        owners = render_owners(load()).splitlines()
        rules = [line for line in owners if line and not line.startswith("#")]
        self.assertTrue(rules[0].startswith("*"))


class CheckTests(unittest.TestCase):
    def test_repository_catalog_is_consistent(self):
        self.assertEqual(check(load()), [])

    def test_detects_drift_from_the_chart_and_missing_paths(self):
        catalog = load()
        broken = catalog["services"]["edu-web"]
        broken["port"] = 9999
        broken["path"] = "frontend/products/missing-web"
        broken["build"]["target"] = "no-such-stage"
        broken["product"] = "unknown"
        errors = "\n".join(check(catalog))
        for expected in ("port 9999", "does not exist", "no `AS no-such-stage`", "no record"):
            self.assertIn(expected, errors)

    def test_detects_chart_services_missing_from_the_catalog(self):
        catalog = load()
        del catalog["services"]["mail-relay"]
        self.assertIn("services.mail-relay is not registered", "\n".join(check(catalog)))

    def test_memory_plan_reads_production_requests_and_tiers(self):
        plan = service_catalog.memory_plan()
        self.assertGreater(plan["budget"], 0)
        self.assertEqual(plan["workloads"]["postgres"][2], "critical")
        self.assertEqual(plan["workloads"]["keycloak"][2], "critical")
        self.assertEqual(plan["workloads"]["edu-api"][0], 1)  # production override
        self.assertTrue(all(request > 0 for _, request, _ in plan["workloads"].values()))

    def test_memory_budget_fails_when_requests_exceed_it(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative in (service_catalog.CHART_VALUES, service_catalog.CHART_PRODUCTION):
                (root / relative).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(ROOT / relative, root / relative)
            values = root / service_catalog.CHART_VALUES
            values.write_text(values.read_text(encoding="utf-8").replace("memoryBudgetMi: 3300", "memoryBudgetMi: 500"), encoding="utf-8")
            self.assertIn("over the 500 Mi node budget", " ".join(service_catalog.check_memory(root)))

    def test_derived_files_are_current(self):
        for relative, render in service_catalog.OUTPUTS.items():
            with self.subTest(file=relative):
                self.assertEqual((ROOT / relative).read_text(encoding="utf-8"), render(load()))


if __name__ == "__main__":
    unittest.main()
